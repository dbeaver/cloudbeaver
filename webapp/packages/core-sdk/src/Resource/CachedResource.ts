/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, makeObservable, action, computed, toJS } from 'mobx';

import { Dependency } from '@cloudbeaver/core-di';
import { Executor, ExecutorInterrupter, IExecutor, IExecutorHandler, ISyncExecutor, SyncExecutor, TaskScheduler } from '@cloudbeaver/core-executor';
import { MetadataMap, uuid } from '@cloudbeaver/core-utils';

import { isResourceKeyList } from './ResourceKeyList';

export interface ICachedResourceMetadata {
  outdated: boolean;
  loading: boolean;
  includes: string[];
  exception: Error | null;
  dependencies: string[];
}

export interface IUseData<TParam> {
  id: string | undefined;
  param: TParam;
  isInUse: boolean;
}

export interface IDataError<TParam> {
  param: TParam;
  exception: Error;
}

export type IParamAlias<TParam> = {
  param: TParam;
  getAlias: (param: TParam) => TParam;
  isEqual: undefined;
} | {
  param: (param: TParam) => boolean;
  isEqual: (paramA: TParam, paramB: TParam) => boolean;
  getAlias: (param: TParam) => TParam;
};

export type CachedResourceData<TResource> = TResource extends CachedResource<infer T, any, any, any, any> ? T : never;
export type CachedResourceValue<TResource> = TResource extends CachedResource<any, infer T, any, any, any> ? T : never;
export type CachedResourceParam<TResource> = TResource extends CachedResource<any, any, infer T, any, any> ? T : never;
export type CachedResourceKey<TResource> = TResource extends CachedResource<any, any, any, infer T, any> ? T : never;
export type CachedResourceContext<TResource> = TResource extends CachedResource<any, any, any, any, infer T> ? T : void;

export const CachedResourceParamKey = Symbol('@cached-resource/param-default');

export abstract class CachedResource<
  TData,
  TValue,
  TParam,
  TKey,
  TContext extends ReadonlyArray<string>
> extends Dependency {
  data: TData;

  get isResourceInUse(): boolean {
    return Array.from(this.metadata.values())
      .some(metadata => metadata.dependencies.length > 0);
  }

  readonly onUse: ISyncExecutor<IUseData<TParam | undefined>>;
  readonly onDataOutdated: ISyncExecutor<TParam | undefined>;
  readonly onDataUpdate: ISyncExecutor<TParam>;
  readonly onDataError: ISyncExecutor<IDataError<TParam>>;
  readonly beforeLoad: IExecutor<TParam>;

  protected metadata: MetadataMap<TKey, ICachedResourceMetadata>;
  protected loadedKeys: TParam[];
  protected defaultIncludes: TContext; // needed for CachedResourceContext

  protected get loading(): boolean {
    return this.scheduler.executing;
  }

  protected scheduler: TaskScheduler<TParam>;
  protected paramAliases: Array<IParamAlias<TParam>>;
  protected logActivity: boolean;
  protected outdateWaitList: TParam[];

  private readonly typescriptHack: TValue;

  constructor(
    defaultValue: TData,
    defaultIncludes: TContext = [] as any
  ) {
    super();

    this.isKeyEqual = this.isKeyEqual.bind(this);
    this.includes = this.includes.bind(this);
    this.loadingTask = this.loadingTask.bind(this);

    this.logActivity = false;
    this.loadedKeys = [];

    this.typescriptHack = null as any;
    this.defaultIncludes = defaultIncludes;
    this.paramAliases = [];
    this.outdateWaitList = [];
    this.metadata = new MetadataMap(() => (observable({
      outdated: true,
      loading: false,
      exception: null,
      includes: observable([...this.defaultIncludes]),
      dependencies: observable([]),
    }, undefined, { deep: false })));
    this.scheduler = new TaskScheduler(this.includes);
    this.data = defaultValue;
    this.beforeLoad = new Executor(null, this.includes);
    this.onUse = new SyncExecutor();
    this.onDataOutdated = new SyncExecutor<TParam | undefined>(null);
    this.onDataUpdate = new SyncExecutor<TParam>(null);
    this.onDataError = new SyncExecutor<IDataError<TParam>>(null);

    this.onUse.setInitialDataGetter(() => ({ id: undefined, param: undefined, isInUse: false }));

    if (this.logActivity) {
      // this.spy(this.beforeLoad, 'beforeLoad');
      // this.spy(this.onDataOutdated, 'onDataOutdated');
      this.spy(this.onDataUpdate, 'onDataUpdate');
      this.spy(this.onDataError, 'onDataError');
    }

    makeObservable<
    this,
    'loader' | 'loadedKeys' | 'commitIncludes' | 'resetIncludes' | 'markOutdatedSync'
    >(this, {
      loadedKeys: observable,
      data: observable,
      isResourceInUse: computed,
      loader: action,
      markDataLoading: action,
      markDataLoaded: action,
      markDataError: action,
      markOutdated: action,
      markUpdated: action,
      commitIncludes: action,
      markOutdatedSync: action,
      resetIncludes: action,
      use: action,
      free: action,
    });

    setInterval(() => {
      // mark resource outdate when it's not used
      if (!this.isResourceInUse && !this.isOutdated()) {
        this.markOutdated();

        if (this.logActivity) {
          console.log('Resource outdated lazy: ', this.getName());
        }
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Mark resource as in use when {@link resource} is in use
   * @param resource resource to depend on
   */
  connect(
    resource: CachedResource<any, any, any, any, any>
  ): void {
    let subscription: string | null = null;

    resource.onUse.addHandler(() => {
      if (resource.isResourceInUse) {
        if (!subscription) {
          subscription = this.use(CachedResourceParamKey);
        }
      } else {
        if (subscription) {
          this.free(CachedResourceParamKey, subscription);
          subscription = null;
        }
      }
    });
  }

  sync<T = TParam>(
    resource: CachedResource<any, any, T, any, any>,
    mapTo?: (param: TParam) => T,
    mapOut?: (param: T | undefined) => TParam
  ): void {
    resource.outdateResource(this, mapOut);

    if (this.logActivity) {
      // resource.onDataUpdate.addHandler(resource.logLock('onDataUpdate > ' + this.getName()));
    }

    // resource.onDataUpdate.addHandler(param => { this.load(param, context); });

    if (this.logActivity) {
      // resource.onDataUpdate.addHandler(resource.logLock('onDataUpdate < ' + this.getName()));
    }

    this.preloadResource(resource, mapTo);
  }

  updateResource<T = TParam>(resource: CachedResource<any, any, T, any, any>, map?: (param: TParam) => T): this {
    this.onDataUpdate.addHandler(param => {
      try {
        if (this.logActivity) {
          console.group(this.getActionPrefixedName(' update - ' + resource.getName()));
        }

        if (map) {
          param = map(param) as any as TParam;
        }

        resource.markUpdated(param as any as T);
      } finally {
        if (this.logActivity) {
          console.groupEnd();
        }
      }
    });

    return this;
  }

  outdateResource<T = TParam>(
    resource: CachedResource<any, any, T, any, any>,
    map?: (param: TParam | undefined) => T
  ): this {
    this.onDataOutdated.addHandler(param => {
      try {
        if (this.logActivity) {
          console.group(this.getActionPrefixedName(' outdate - ' + resource.getName()));
        }

        if (map) {
          param = map(param) as any as TParam;
        }

        resource.markOutdated(param as any as T);
      } finally {
        if (this.logActivity) {
          console.groupEnd();
        }
      }
    });

    return this;
  }

  preloadResource<T = TParam>(resource: CachedResource<any, any, T, any, any>, map?: (param: TParam) => T): this {
    resource.connect(this);

    this.beforeLoad.addHandler(async param => {
      try {
        if (this.logActivity) {
          console.group(this.getActionPrefixedName(' preload - ' + resource.getName()));
        }

        if (map) {
          param = map(param) as any as TParam;
        }

        await resource.load(param as any as T);
      } finally {
        if (this.logActivity) {
          console.groupEnd();
        }
      }
    });

    return this;
  }

  before(handler: IExecutorHandler<TParam>): this {
    this.beforeLoad.addHandler(async (param, contexts) => {
      try {
        if (this.logActivity) {
          console.group(this.getActionPrefixedName(' preload - ' + handler.name));
        }

        await handler(param, contexts);
      } finally {
        if (this.logActivity) {
          console.groupEnd();
        }
      }
    });

    return this;
  }

  isInUse(param: TParam): boolean {
    return this.getMetadata(param).dependencies.length > 0;
  }

  use(param: TParam | typeof CachedResourceParamKey, id = uuid()): string {
    this.updateMetadata(param as TParam, metadata => {
      if (param === CachedResourceParamKey) {
        metadata.outdated = false;
      }
      metadata.dependencies.push(id);
    });
    this.onUse.execute(
      param === CachedResourceParamKey
        ? { id, param: undefined, isInUse: true }
        : { id, param, isInUse: true }
    );
    if (this.logActivity) {
      console.log('Use resource: ', this.getName(), param);
    }
    return id;
  }

  free(param: TParam | typeof CachedResourceParamKey, id: string): void {
    this.updateMetadata(param as TParam, metadata => {
      if (metadata.dependencies.length > 0) {
        if (param === CachedResourceParamKey) {
          metadata.outdated = false;
        }
        metadata.dependencies = metadata.dependencies.filter(v => v !== id);
      }
    });
    this.onUse.execute(
      param === CachedResourceParamKey
        ? { id, param: undefined, isInUse: false }
        : { id, param, isInUse: false }
    );

    if (this.logActivity) {
      console.log('Free resource: ', this.getName(), param);
    }
  }

  abstract isLoaded(param: TParam, context?: TContext): boolean;

  isAlias(key: TParam): boolean {
    return this.paramAliases.some(alias => {
      if ('isEqual' in alias && alias.isEqual) {
        return alias.param(key);
      } else {
        return alias.param === key;
      }
    });
  }

  waitLoad(): Promise<void> {
    return this.scheduler.wait();
  }

  isLoading(): boolean {
    return this.loading;
  }

  isAliasLoaded(key: TParam): boolean {
    return this.loadedKeys.some(loadedKey => this.isAliasEqual(key, loadedKey));
  }

  isIncludes(key: TParam, includes: TContext): boolean {
    key = this.transformParam(key);
    const metadata = this.getMetadata(key);

    return includes.every(include => metadata.includes.includes(include));
  }

  getMetadata(param: TParam): ICachedResourceMetadata {
    const metadata = this.metadata.get(param as any as TKey);
    return metadata;
  }

  updateMetadata(param: TParam, callback: (data: ICachedResourceMetadata) => void): void {
    const metadata = this.getMetadata(param);
    callback(metadata);
  }

  deleteMetadata(param: TParam): void {
    this.metadata.delete(param as any as TKey);
  }

  getException(param: TParam): Error | null {
    param = this.transformParam(param);
    return this.getMetadata(param).exception;
  }

  isOutdated(param?: TParam): boolean {
    if (param === undefined) {
      return (
        Array.from(this.metadata.values()).some(metadata => metadata.outdated)
        && this.loadedKeys.length === 0
      );
    }

    if (this.isAlias(param) && !this.isAliasLoaded(param)) {
      return true;
    }

    param = this.transformParam(param);
    const metadata = this.getMetadata(param);
    return metadata.outdated;
  }

  isDataLoading(param: TParam): boolean {
    param = this.transformParam(param);
    return this.getMetadata(param).loading;
  }

  markDataLoading(param: TParam, context?: TContext): void {
    param = this.transformParam(param);
    this.updateMetadata(param, metadata => {
      metadata.loading = true;
    });
  }

  markDataLoaded(param: TParam, includes?: TContext): void {
    param = this.transformParam(param);

    if (includes) {
      this.commitIncludes(param, includes);
    }

    this.updateMetadata(param, metadata => {
      metadata.loading = false;
    });
  }

  markDataError(exception: Error, param: TParam, context?: TContext): void {
    if (this.isAlias(param) && !this.isAliasLoaded(param)) {
      this.loadedKeys.push(param);
    }

    param = this.transformParam(param);
    this.updateMetadata(param, metadata => {
      metadata.exception = exception;
      metadata.outdated = false;
    });
    this.onDataError.execute({ param, exception });
  }

  cleanError(param: TParam): void {
    param = this.transformParam(param);
    this.updateMetadata(param, metadata => {
      metadata.exception = null;
    });
  }

  markOutdated(param?: TParam): void {
    const isKeyExecuting = param === undefined ? this.scheduler.executing : this.scheduler.isExecuting(param);

    if (isKeyExecuting && !this.outdateWaitList.some(key => this.includes(param!, key))) {
      this.outdateWaitList.push(param!);
      return;
    }

    this.markOutdatedSync(param!);
  }

  markUpdated(param: TParam): void {
    if (this.isAlias(param) && !this.isAliasLoaded(param)) {
      this.loadedKeys.push(param);
    }

    param = this.transformParam(param);
    this.updateMetadata(param, metadata => {
      metadata.outdated = false;
    });
  }

  dataUpdate(param: TParam): void {
    this.cleanError(param);
    this.onDataUpdate.execute(param);
  }

  addAlias(param: TParam, getAlias: (param: TParam) => TParam): void;
  addAlias<T extends TParam>(
    param: (param: TParam) => param is T,
    getAlias: (param: T) => TParam,
    isEqual: (paramA: T, paramB: T) => boolean
  ): void;
  addAlias(
    param: (param: TParam) => boolean,
    getAlias: (param: TParam) => TParam,
    isEqual: (paramA: TParam, paramB: TParam) => boolean
  ): void;
  addAlias(
    param: TParam | ((param: TParam) => boolean),
    getAlias: (param: TParam) => TParam,
    isEqual?: (paramA: TParam, paramB: TParam) => boolean
  ): void {
    this.paramAliases.push({ param, getAlias, isEqual } as IParamAlias<TParam>);
  }

  transformParam(param: TParam): TParam {
    if (!this.validateParam(param)) {
      let paramString = JSON.stringify(toJS(param));

      if (typeof param === 'symbol') {
        paramString = param.toString();
      } else if (isResourceKeyList(param))  {
        paramString = param.toString();
      }
      console.warn(this.getActionPrefixedName(`wrong param "${paramString}"`));
    }
    let deep = 0;
    // eslint-disable-next-line no-labels
    transform:

    if (deep < 10) {
      for (const alias of this.paramAliases) {
        if ('isEqual' in alias && alias.isEqual) {
          if (alias.param(param)) {
            param = alias.getAlias(param);
            deep++;
            // eslint-disable-next-line no-labels
            break transform;
          }
        } else {
          if (alias.param === param) {
            param = alias.getAlias(param);
            deep++;
            // eslint-disable-next-line no-labels
            break transform;
          }
        }
      }
    } else {
      console.warn('CachedResource: parameter transform was stopped');
    }
    return param;
  }

  async refresh(param: TParam, context?: TContext): Promise<any> {
    await this.preLoadData(param, false, context);
    await this.loadData(param, true, context);
    return this.data;
  }

  async load(param: TParam, context?: TContext): Promise<any> {
    await this.preLoadData(param, false, context);
    await this.loadData(param, false, context);
    return this.data;
  }

  getIncludes(key?: TParam): ReadonlyArray<string> {
    if (key === undefined) {
      return this.defaultIncludes;
    }
    key = this.transformParam(key);

    const metadata = this.getMetadata(key);

    return metadata.includes;
  }

  getIncludesMap(
    key?: TParam,
    includes: ReadonlyArray<string> = this.defaultIncludes
  ): Record<string, any> {
    const keyIncludes = this.getIncludes(key);
    return ['customIncludeBase', ...includes, ...keyIncludes].reduce<any>((map, key) => {
      map[key] = true;

      return map;
    }, {});
  }

  protected validateParam(param: TParam): boolean {
    return param === CachedResourceParamKey;
  }

  protected resetIncludes(): void {
    for (const metadata of this.metadata.values()) {
      metadata.includes = observable([...this.defaultIncludes]);
    }
  }

  protected commitIncludes(key: TParam, includes: ReadonlyArray<string>): void {
    key = this.transformParam(key);
    this.updateMetadata(key, metadata => {
      for (const include of includes) {
        if (!metadata.includes.includes(include)) {
          metadata.includes.push(include);
        }
      }
    });

  }

  protected setData(data: TData): void {
    this.data = data;
  }

  protected markOutdatedSync(param?: TParam): void {
    if (param === undefined) {
      for (const param of this.metadata.keys()) {
        this.updateMetadata(param as unknown as TParam, metadata => {
          if (param === CachedResourceParamKey) {
            return;
          }

          metadata.outdated = true;
        });
      }
      this.loadedKeys = [];
      this.resetIncludes();
    } else {

      if (this.isAlias(param)) {
        const index = this.loadedKeys.findIndex(key => this.isAliasEqual(param!, key));

        if (index >= 0) {
          this.loadedKeys.splice(index, 1);
        }
      }

      param = this.transformParam(param);
      this.updateMetadata(param, metadata => {
        metadata.outdated = true;
      });
    }

    this.onDataOutdated.execute(param);
  }

  isAliasEqual(param: TParam, second: TParam): boolean {
    if (param === second) {
      return true;
    }

    return this.paramAliases.some(alias => {
      if ('isEqual' in alias && alias.isEqual) {
        return alias.param(param) && alias.param(second) && alias.isEqual(param, second);
      }

      return false;
    });
  }

  isKeyEqual(param: TParam, second: TParam): boolean {
    return param === second;
  }

  includes(param: TParam, second: TParam): boolean {
    if (this.isAliasEqual(param, second)) {
      return true;
    }

    param = this.transformParam(param);
    second = this.transformParam(second);
    return this.isKeyEqual(param, second);
  }

  protected abstract loader(
    param: TParam,
    context: ReadonlyArray<string> | undefined,
    refresh: boolean
  ): Promise<TData>;

  protected async performUpdate<T>(
    param: TParam,
    context: TContext | undefined,
    update: (param: TParam, context?: ReadonlyArray<string>) => Promise<T>,
  ): Promise<T>;
  protected async performUpdate<T>(
    param: TParam,
    context: TContext | undefined,
    update: (param: TParam, context?: ReadonlyArray<string>) => Promise<T>,
    exitCheck: (param: TParam, context?: ReadonlyArray<string>) => boolean
  ): Promise<T | undefined>;

  protected async performUpdate<T>(
    param: TParam,
    context: TContext | undefined,
    update: (param: TParam, context?: ReadonlyArray<string>) => Promise<T>,
    exitCheck?: (param: TParam, context?: ReadonlyArray<string>) => boolean
  ): Promise<T | undefined> {
    const contexts = await this.beforeLoad.execute(param);

    if (ExecutorInterrupter.isInterrupted(contexts)) {
      return;
    }

    await this.scheduler.waitRelease(param);

    if (exitCheck?.(param, context)) {
      return;
    }

    let loaded = false;
    return this.scheduler.schedule(
      param,
      async () => {
        // repeated because previous task maybe has been load requested data
        if (exitCheck?.(param, context)) {
          return;
        }

        this.markDataLoading(param, context);
        try {
          const result = await this.taskWrapper(param, context, true, update);
          loaded = true;
          return result;
        } finally {
          this.markDataLoaded(param, context);
        }
      },
      {
        before: () => {
          this.markOutdatedSync(param);
        },
        success: () => {
          if (loaded) {
            this.dataUpdate(param);
          }
        },
        error: exception => this.markDataError(exception, param, context),
      });
  }

  protected async preLoadData(
    param: TParam,
    refresh: boolean,
    context?: TContext
  ): Promise<void> { }

  protected async loadData(
    param: TParam,
    refresh: boolean,
    context?: TContext
  ): Promise<void> {
    if (!refresh) {
      await this.scheduler.waitRelease(param);

      if (this.isLoaded(param, context) && !this.isOutdated(param)) {
        return;
      }
    }

    const contexts = await this.beforeLoad.execute(param);

    if (ExecutorInterrupter.isInterrupted(contexts) && !refresh) {
      return;
    }

    let loaded = false;
    await this.scheduler.schedule(
      param,
      async () => {
        // repeated because previous task maybe has been load requested data
        if (this.isLoaded(param, context) && !this.isOutdated(param)) {
          return;
        }

        this.markDataLoading(param, context);
        try {
          const result = await this.taskWrapper(param, context, refresh, this.loadingTask);
          loaded = true;
          return result;
        } finally {
          this.markDataLoaded(param, context);
        }
      },
      {
        before: () => {
          if (refresh) {
            this.markOutdatedSync(param);
          }
        },
        success: async () => {
          if (loaded) {
            this.dataUpdate(param);
          }
        },
        error: exception => this.markDataError(exception, param, context),
      });
  }

  private async loadingTask(
    param: TParam,
    context: ReadonlyArray<string> | undefined,
    refresh: boolean
  ) {
    this.setData(await this.loader(param, context, refresh));
  }

  private async taskWrapper<T>(
    param: TParam,
    context: ReadonlyArray<string> | undefined,
    refresh: boolean,
    promise: (
      param: TParam,
      context: ReadonlyArray<string> | undefined,
      refresh: boolean
    ) => Promise<T>
  ) {
    if (this.logActivity) {
      console.log(this.getActionPrefixedName('loading'));
    }

    const value = await promise(param, context, refresh);
    this.markUpdated(param);

    for (let i = 0; i < this.outdateWaitList.length; i++) {
      const key = this.outdateWaitList[i];
      // if (this.includes(param, key)) {
      this.markOutdatedSync(key);
      // this.outdateWaitList.splice(i, 1);
      // break;
      // }
    }
    this.outdateWaitList = [];
    return value;
  }

  public getName(): string {
    return this.constructor.name;
  }

  protected logLock = (action: string): IExecutorHandler<any> => () => {
    console.log(this.getActionPrefixedName(action));
  };

  private readonly logName = (action: string): IExecutorHandler<any> => () => {
    console.log(this.getActionPrefixedName(action));
  };

  protected getActionPrefixedName(action: string): string {
    return this.getName() + ': ' + action;
  }

  private readonly logInterrupted = (action: string): IExecutorHandler<any> => (data, contexts) => {
    if (ExecutorInterrupter.isInterrupted(contexts)) {
      console.log(this.getActionPrefixedName(action) + 'interrupted');
    }
  };

  private spy(executor: ISyncExecutor<any>, action: string): void {
    executor
      .addHandler(this.logName(action))
      .addPostHandler(this.logInterrupted(action));
  }
}
