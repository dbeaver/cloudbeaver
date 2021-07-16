/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, makeObservable, action } from 'mobx';

import { Dependency } from '@cloudbeaver/core-di';
import { Executor, ExecutorInterrupter, IExecutor, TaskScheduler } from '@cloudbeaver/core-executor';
import { MetadataMap } from '@cloudbeaver/core-utils';

export interface ICachedResourceMetadata {
  outdated: boolean;
  loading: boolean;
  exception: Error | null;
}

export interface IDataError<TParam> {
  param: TParam;
  exception: Error;
}

export interface IParamAlias<TParam> {
  param: TParam;
  getAlias: (param: TParam) => TParam;
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
> extends Dependency {
  data: TData;

  readonly onDataOutdated: IExecutor<TParam>;
  readonly onDataUpdate: IExecutor<TParam>;
  readonly onDataError: IExecutor<IDataError<TParam>>;
  readonly beforeLoad: IExecutor<TParam>;

  protected metadata: MetadataMap<TKey, ICachedResourceMetadata>;

  protected get loading(): boolean {
    return this.scheduler.executing;
  }

  protected scheduler: TaskScheduler<TParam>;
  protected paramAliases: Array<IParamAlias<TParam>>;

  constructor(defaultValue: TData) {
    super();
    makeObservable<CachedResource<TData, TParam, TKey, TContext>, 'loader'>(this, {
      data: observable,
      loader: action,
      markDataLoading: action,
      markDataLoaded: action,
      markDataError: action,
      markOutdated: action,
      markUpdated: action,
    });

    this.includes = this.includes.bind(this);
    this.loadingTask = this.loadingTask.bind(this);

    this.paramAliases = [];
    this.metadata = new MetadataMap(() => ({ outdated: true, loading: false, exception: null }));
    this.scheduler = new TaskScheduler(this.includes);
    this.data = defaultValue;
    this.beforeLoad = new Executor(null, this.includes);
    this.onDataOutdated = new Executor(null, this.includes);
    this.onDataUpdate = new Executor(null, this.includes);
    this.onDataError = new Executor<IDataError<TParam>>(null, (a, b) => this.includes(a.param, b.param));

    // const logName = (action: string) => () => console.log(this.constructor.name + ': ' + action);
    // const logInterrupted = (action: string): IExecutorHandler<any> => (data, contexts) => {
    //   if (ExecutorInterrupter.isInterrupted(contexts)) {
    //     console.log(this.constructor.name + ': ' + action + 'interrupted');
    //   }
    // };

    // this.beforeLoad
    //   .addHandler(logName('beforeLoad'))
    //   .addPostHandler(logInterrupted('beforeLoad'));
    // this.onDataOutdated
    //   .addHandler(logName('onDataOutdated'))
    //   .addPostHandler(logInterrupted('onDataOutdated'));
    // this.onDataUpdate
    //   .addHandler(logName('onDataUpdate'))
    //   .addPostHandler(logInterrupted('onDataUpdate'));
    // this.onDataError
    //   .addHandler(logName('onDataError'))
    //   .addPostHandler(logInterrupted('onDataError'));
  }

  sync(
    resource: CachedResource<any, TParam, TParam, void>,
    context: TContext
  ): void {
    resource.onDataOutdated.addHandler(this.markOutdated.bind(this));
    resource.onDataUpdate.addHandler(param => this.load(param, context));
    this.beforeLoad.addHandler(param => resource.load(param));
  }

  abstract isLoaded(param: TParam, context: TContext): boolean;

  waitLoad(): Promise<void> {
    return this.scheduler.wait();
  }

  isLoading(): boolean {
    return this.loading;
  }

  getException(param: TParam): Error | null {
    param = this.transformParam(param);
    return this.metadata.get(param as unknown as TKey).exception;
  }

  isOutdated(param: TParam): boolean {
    param = this.transformParam(param);
    return this.metadata.get(param as unknown as TKey).outdated;
  }

  isDataLoading(param: TParam): boolean {
    param = this.transformParam(param);
    return this.metadata.get(param as unknown as TKey).loading;
  }

  markDataLoading(param: TParam, context: TContext): void {
    param = this.transformParam(param);
    const metadata = this.metadata.get(param as unknown as TKey);
    metadata.loading = true;
  }

  markDataLoaded(param: TParam, context: TContext): void {
    param = this.transformParam(param);
    const metadata = this.metadata.get(param as unknown as TKey);
    metadata.loading = false;
  }

  async markDataError(exception: Error, param: TParam, context: TContext): Promise<void> {
    param = this.transformParam(param);
    const metadata = this.metadata.get(param as unknown as TKey);
    metadata.exception = exception;
    await this.onDataError.execute({ param, exception });
  }

  async markOutdated(param: TParam): Promise<void> {
    param = this.transformParam(param);
    const metadata = this.metadata.get(param as unknown as TKey);
    metadata.outdated = true;
    await this.onDataOutdated.execute(param);
  }

  markUpdated(param: TParam): void {
    param = this.transformParam(param);
    const metadata = this.metadata.get(param as unknown as TKey);
    metadata.outdated = false;
    metadata.exception = null;
  }

  addAlias(param: TParam, getAlias: (param: TParam) => TParam): void {
    this.paramAliases.push({ param, getAlias });
  }

  transformParam(param: TParam): TParam {
    let deep = 0;
    // eslint-disable-next-line no-labels
    transform:

    if (deep < 10) {
      for (const alias of this.paramAliases) {
        if (this.includes(alias.param, param)) {
          param = alias.getAlias(param);
          deep++;
          // eslint-disable-next-line no-labels
          break transform;
        }
      }
    } else {
      console.warn('CachedResource: parameter transform was stopped');
    }
    return param;
  }

  async refresh(param: TParam, context: TContext): Promise<any> {
    param = this.transformParam(param);
    await this.loadData(param, true, context);
    return this.data;
  }

  async load(param: TParam, context: TContext): Promise<any> {
    param = this.transformParam(param);
    await this.loadData(param, false, context);
    return this.data;
  }

  protected includes(param: TParam, second: TParam): boolean {
    param = this.transformParam(param);
    second = this.transformParam(second);
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

    param = this.transformParam(param);
    const contexts = await this.beforeLoad.execute(param);

    if (ExecutorInterrupter.isInterrupted(contexts)) {
      return;
    }

    this.markDataLoading(param, context);
    return this.scheduler.schedule(
      param,
      async () => {
        // repeated because previous task maybe has been load requested data
        if (exitCheck?.()) {
          return;
        }

        return await this.taskWrapper(param, context, update);
      },
      {
        after: () => this.markDataLoaded(param, context),
        success: () => this.onDataUpdate.execute(param),
        error: exception => this.markDataError(exception, param, context),
      });
  }

  protected async loadData(param: TParam, refresh: boolean, context: TContext): Promise<void> {
    param = this.transformParam(param);
    const contexts = await this.beforeLoad.execute(param);

    if (ExecutorInterrupter.isInterrupted(contexts) && !refresh) {
      return;
    }

    if (this.isLoaded(param, context) && !this.isOutdated(param) && !refresh) {
      return;
    }

    this.markDataLoading(param, context);
    await this.scheduler.schedule(
      param,
      async () => {
        // repeated because previous task maybe has been load requested data
        if (this.isLoaded(param, context) && !this.isOutdated(param) && !refresh) {
          return;
        }

        await this.taskWrapper(param, context, this.loadingTask);
      },
      {
        after: () => this.markDataLoaded(param, context),
        success: () => this.onDataUpdate.execute(param),
        error: exception => this.markDataError(exception, param, context),
      });
  }

  private async loadingTask(param: TParam, context: TContext) {
    this.data = await this.loader(param, context);
  }

  private async taskWrapper<T>(
    param: TParam,
    context: TContext,
    promise: (param: TParam, context: TContext) => Promise<T>
  ) {
    await this.markOutdated(param);
    const value = await promise(param, context);
    this.markUpdated(param);
    return value;
  }
}
