/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { Executor, IExecutor, TaskScheduler } from '@cloudbeaver/core-executor';
import { MetadataMap } from '@cloudbeaver/core-utils';

export interface ICachedResourceMetadata {
  outdated: boolean;
  loading: boolean;
}

@injectable()
export abstract class CachedResource<
  TData,
  TParam,
  TKey = TParam
> {
  @observable
  data: TData;

  readonly onDataOutdated: IExecutor<TParam>;
  readonly onDataUpdate: IExecutor<TData>;

  protected metadata: MetadataMap<TKey, ICachedResourceMetadata>;

  @observable
  protected loading = false;

  protected scheduler: TaskScheduler<TParam>;

  constructor(defaultValue: TData) {
    this.includes = this.includes.bind(this);
    this.loadingTask = this.loadingTask.bind(this);

    this.metadata = new MetadataMap(() => ({ outdated: true, loading: false }));
    this.scheduler = new TaskScheduler(this.includes);
    this.data = defaultValue;
    this.onDataOutdated = new Executor(null, this.includes);
    this.onDataUpdate = new Executor();
  }

  abstract isLoaded(param: TParam): boolean;

  isLoading(): boolean {
    return this.loading;
  }

  isOutdated(param: TParam): boolean {
    return this.metadata.get(param as unknown as TKey).outdated;
  }

  isDataLoading(param: TParam): boolean {
    return this.metadata.get(param as unknown as TKey).loading;
  }

  markDataLoading(param: TParam): void {
    const metadata = this.metadata.get(param as unknown as TKey);
    metadata.loading = true;
  }

  markDataLoaded(param: TParam): void {
    const metadata = this.metadata.get(param as unknown as TKey);
    metadata.loading = false;
  }

  markOutdated(param: TParam): void {
    const metadata = this.metadata.get(param as unknown as TKey);
    metadata.outdated = true;
    this.onDataOutdated.execute(param);
  }

  markUpdated(param: TParam): void {
    const metadata = this.metadata.get(param as unknown as TKey);
    metadata.outdated = false;
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

    this.markDataLoading(param);
    this.loading = true;
    return this.scheduler.schedule(param, async () => {
      // repeated because previous task maybe has been load requested data
      if (exitCheck?.()) {
        return;
      }

      return await this.taskWrapper(param, update);
    }, () => {
      this.markDataLoaded(param);
      this.loading = false;
    });
  }

  protected async loadData(param: TParam, refresh?: boolean): Promise<void> {
    if (this.isLoaded(param) && !this.isOutdated(param) && !refresh) {
      return;
    }

    this.markDataLoading(param);
    this.loading = true;
    await this.scheduler.schedule(param, async () => {
      // repeated because previous task maybe has been load requested data
      if (this.isLoaded(param) && !this.isOutdated(param) && !refresh) {
        return;
      }

      await this.taskWrapper(param, this.loadingTask);
    }, () => {
      this.markDataLoaded(param);
      this.loading = false;
    });
  }

  private async loadingTask(param: TParam) {
    this.data = await this.loader(param);

    // TODO: seems should be moved to scheduler `after` callback
    this.onDataUpdate.execute(this.data);
  }

  private async taskWrapper<T>(param: TParam, promise: (param: TParam) => Promise<T>) {
    this.markOutdated(param);
    const value = await promise(param);
    this.markUpdated(param);
    return value;
  }
}
