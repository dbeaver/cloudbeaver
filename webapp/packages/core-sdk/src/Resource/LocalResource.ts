/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, makeObservable } from 'mobx';

import { Executor, IExecutor, TaskScheduler } from '@cloudbeaver/core-executor';

export abstract class LocalResource<
  TData,
  TParam,
> {
  data: TData;

  readonly onDataOutdated: IExecutor<TParam>;
  readonly onDataUpdate: IExecutor<TData>;

  protected outdated = new Set<TParam>();

  protected dataLoading = new Set<TParam>();

  protected loading = false;

  protected scheduler: TaskScheduler<TParam>;

  constructor(defaultValue: TData) {
    this.includes = this.includes.bind(this);
    this.scheduler = new TaskScheduler(this.includes);
    this.data = defaultValue;
    this.onDataOutdated = new Executor(null, this.includes);
    this.onDataUpdate = new Executor();
    this.loadingTask = this.loadingTask.bind(this);

    makeObservable<LocalResource<TData, TParam>, 'outdated' | 'dataLoading' | 'loading'>(this, {
      data: observable,
      outdated: observable,
      dataLoading: observable,
      loading: observable,
    });
  }

  abstract isLoaded(param: TParam): boolean;

  isOutdated(param: TParam): boolean {
    return this.outdated.has(param);
  }

  isLoading(): boolean {
    return this.loading;
  }

  isDataLoading(key: TParam): boolean {
    return this.dataLoading.has(key);
  }

  markDataLoading(key: TParam): void {
    this.dataLoading.add(key);
  }

  markDataLoaded(key: TParam): void {
    this.dataLoading.delete(key);
  }

  markOutdated(param: TParam): void {
    this.outdated.add(param);
    this.onDataOutdated.execute(param);
  }

  markUpdated(param: TParam): void {
    this.outdated.delete(param);
  }

  async refresh(param: TParam): Promise<any> {
    await this.loadData(param, true);
    return this.data;
  }

  async load(param: TParam): Promise<any> {
    await this.loadData(param);
    return this.data;
  }

  protected includes(param: TParam, second: TParam): boolean {
    return param === second;
  }

  protected abstract loader(param: TParam): Promise<TData>;

  protected async performUpdate<T>(
    param: TParam,
    update: (param: TParam) => Promise<T>,
  ): Promise<T>
  protected async performUpdate<T>(
    param: TParam,
    update: (param: TParam) => Promise<T>,
    exitCheck: () => boolean
  ): Promise<T | undefined>;

  protected async performUpdate<T>(
    param: TParam,
    update: (param: TParam) => Promise<T>,
    exitCheck?: () => boolean
  ): Promise<T | undefined> {
    if (exitCheck?.()) {
      return;
    }

    return this.scheduler.schedule(param, async () => {
      // repeated because previous task maybe has been load requested data
      if (exitCheck?.()) {
        return;
      }

      return await this.taskWrapper(param, update);
    });
  }

  protected async loadData(param: TParam, refresh?: boolean): Promise<void> {
    if (this.isLoaded(param) && !this.isOutdated(param) && !refresh) {
      return;
    }

    await this.scheduler.schedule(param, async () => {
      // repeated because previous task maybe has been load requested data
      if (this.isLoaded(param) && !this.isOutdated(param) && !refresh) {
        return;
      }

      await this.taskWrapper(param, this.loadingTask);
    });
  }

  private async loadingTask(param: TParam) {
    this.data = await this.loader(param);
  }

  private async taskWrapper<T>(param: TParam, promise: (param: TParam) => Promise<T>) {
    const prevState = this.loading;
    this.loading = true;
    this.markOutdated(param);
    try {
      const value = await promise(param);
      this.markUpdated(param);
      this.onDataUpdate.execute(this.data);
      return value;
    } finally {
      this.loading = prevState;
    }
  }
}
