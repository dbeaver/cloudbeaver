/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, makeObservable } from 'mobx';

import { Executor, IExecutor, TaskScheduler } from '@cloudbeaver/core-executor';
import { MetadataMap } from '@cloudbeaver/core-utils';

export interface ICachedResourceMetadata {
  outdated: boolean;
  loading: boolean;
}

export type CachedResourceData<
  TResource extends CachedResource<any, any, any, any>
> = TResource extends CachedResource<infer T, any, any> ? T : never;

export type CachedResourceParam<
  TResource extends CachedResource<any, any, any, any>
> = TResource extends CachedResource<any, infer T, any> ? T : never;

export type CachedResourceKey<
  TResource extends CachedResource<any, any, any, any>
> = TResource extends CachedResource<any, any, infer T> ? T : never;

export abstract class CachedResource<
  TData,
  TParam,
  TKey = TParam,
  TContext = void
> {
  data: TData;

  readonly onDataOutdated: IExecutor<TParam>;
  readonly onDataUpdate: IExecutor<TData>;

  protected metadata: MetadataMap<TKey, ICachedResourceMetadata>;

  protected loading = false;

  protected scheduler: TaskScheduler<TParam>;

  constructor(defaultValue: TData) {
    makeObservable<CachedResource<TData, TParam, TKey, TContext>, 'loading'>(this, {
      data: observable,
      loading: observable,
    });

    this.includes = this.includes.bind(this);
    this.loadingTask = this.loadingTask.bind(this);

    this.metadata = new MetadataMap(() => ({ outdated: true, loading: false }));
    this.scheduler = new TaskScheduler(this.includes);
    this.data = defaultValue;
    this.onDataOutdated = new Executor(null, this.includes);
    this.onDataUpdate = new Executor();
  }

  abstract isLoaded(param: TParam, context: TContext): boolean;

  waitLoad(): Promise<void> {
    return this.scheduler.wait();
  }

  isLoading(): boolean {
    return this.loading;
  }

  isOutdated(param: TParam): boolean {
    return this.metadata.get(param as unknown as TKey).outdated;
  }

  isDataLoading(param: TParam): boolean {
    return this.metadata.get(param as unknown as TKey).loading;
  }

  markDataLoading(param: TParam, context: TContext): void {
    const metadata = this.metadata.get(param as unknown as TKey);
    metadata.loading = true;
  }

  markDataLoaded(param: TParam, context: TContext): void {
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

  async refresh(param: TParam, context: TContext): Promise<any> {
    await this.loadData(param, true, context);
    return this.data;
  }

  async load(param: TParam, context: TContext): Promise<any> {
    await this.loadData(param, false, context);
    return this.data;
  }

  protected includes(param: TParam, second: TParam): boolean {
    return param === second;
  }

  protected abstract loader(param: TParam, context: TContext): Promise<TData>;

  protected async performUpdate<T>(
    param: TParam,
    context: TContext,
    update: (param: TParam, context: TContext) => Promise<T>,
  ): Promise<T>
  protected async performUpdate<T>(
    param: TParam,
    context: TContext,
    update: (param: TParam, context: TContext) => Promise<T>,
    exitCheck: () => boolean
  ): Promise<T | undefined>;

  protected async performUpdate<T>(
    param: TParam,
    context: TContext,
    update: (param: TParam, context: TContext) => Promise<T>,
    exitCheck?: () => boolean
  ): Promise<T | undefined> {
    if (exitCheck?.()) {
      return;
    }

    this.markDataLoading(param, context);
    this.loading = true;
    return this.scheduler.schedule(param, async () => {
      // repeated because previous task maybe has been load requested data
      if (exitCheck?.()) {
        return;
      }

      return await this.taskWrapper(param, context, update);
    }, () => {
      this.markDataLoaded(param, context);
      this.loading = false;
    });
  }

  protected async loadData(param: TParam, refresh: boolean, context: TContext): Promise<void> {
    if (this.isLoaded(param, context) && !this.isOutdated(param) && !refresh) {
      return;
    }

    this.markDataLoading(param, context);
    this.loading = true;
    await this.scheduler.schedule(param, async () => {
      // repeated because previous task maybe has been load requested data
      if (this.isLoaded(param, context) && !this.isOutdated(param) && !refresh) {
        return;
      }

      await this.taskWrapper(param, context, this.loadingTask);
    }, () => {
      this.markDataLoaded(param, context);
      this.loading = false;
    });
  }

  private async loadingTask(param: TParam, context: TContext) {
    this.data = await this.loader(param, context);

    // TODO: seems should be moved to scheduler `after` callback
    this.onDataUpdate.execute(this.data);
  }

  private async taskWrapper<T>(
    param: TParam,
    context: TContext,
    promise: (param: TParam, context: TContext) => Promise<T>
  ) {
    this.markOutdated(param);
    const value = await promise(param, context);
    this.markUpdated(param);
    return value;
  }
}
