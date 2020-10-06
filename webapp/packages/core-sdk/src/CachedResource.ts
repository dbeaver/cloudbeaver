/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';
import { Subject, Observable } from 'rxjs';

import { injectable } from '@cloudbeaver/core-di';

interface IResourceTask<TParam> {
  readonly param: TParam;
  readonly task: Promise<any>;
}

@injectable()
export abstract class CachedResource<
  TData,
  TParam,
> {
  @observable 
  data: TData;

  readonly onDataUpdate: Observable<TData>;
  readonly onDataOutdated: Observable<TParam>;

  @observable 
  protected outdated = new Set<TParam>();

  @observable 
  protected loading = false;

  protected outdatedSubject: Subject<TParam>;
  protected dataSubject: Subject<TData>;

  @observable.shallow
  protected tasks: IResourceTask<TParam>[] = [];

  constructor(defaultValue: TData) {
    this.data = defaultValue;
    this.outdatedSubject = new Subject();
    this.dataSubject = new Subject();
    this.onDataOutdated = this.outdatedSubject.asObservable();
    this.onDataUpdate = this.dataSubject.asObservable();
    this.loadingTask = this.loadingTask.bind(this);
  }

  abstract isLoaded(param: TParam): boolean;

  isOutdated(param: TParam): boolean {
    return this.outdated.has(param);
  }

  isLoading(): boolean {
    return this.loading;
  }

  markOutdated(param: TParam): void {
    this.outdated.add(param);
    this.outdatedSubject.next(param);
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
    if (exitCheck && exitCheck()) {
      return;
    }

    return this.task(param, async () => {
      // repeated because previous task maybe has been load requested data
      if (exitCheck && exitCheck()) {
        return;
      }
      
      return await this.taskWrapper(param, update);
    })
  }

  protected async loadData(param: TParam, refresh?: boolean): Promise<void> {
    if (this.isLoaded(param) && !this.isOutdated(param) && !refresh) {
      return;
    }

    await this.task(param, async () => {
      // repeated because previous task maybe has been load requested data
      if (this.isLoaded(param) && !this.isOutdated(param) && !refresh) {
        return;
      }

      await this.taskWrapper(param, this.loadingTask);
    })
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
      this.dataSubject.next(this.data);
      return value;
    } finally {
      this.loading = prevState;
    }
  }

  protected async task<T>(param: TParam, action: (param: TParam) => Promise<T>): Promise<T> {
    const task: IResourceTask<TParam> = {
      param,
      task: this.wrappedTask(param, action),
    }
    this.tasks.push(task);

    try {
      return await task.task;
    } finally {
      this.tasks.splice(this.tasks.indexOf(task), 1);
    }
  }

  private async wrappedTask<T>(param: TParam, task: (param: TParam) => Promise<T>): Promise<T> {
    const queue = this.tasks.filter(task => this.includes(param, task.param));

    for(const task of queue) {
      try {
        await task.task;
      } catch {}
    }

    return await task(param);
  }
}
