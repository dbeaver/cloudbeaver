/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, makeObservable, action, computed, toJS } from 'mobx';

import { Dependency } from '@cloudbeaver/core-di';
import { ExecutionContext, Executor, ExecutorInterrupter, IExecutor, IExecutorHandler, IExecutionContextProvider, ISyncExecutor, SyncExecutor, TaskScheduler } from '@cloudbeaver/core-executor';
import { MetadataMap, uuid } from '@cloudbeaver/core-utils';

import { isResourceAlias, ResourceAlias, ResourceAliasFactory, ResourceAliasOptions } from './ResourceAlias';
import { ResourceError } from './ResourceError';
import type { ResourceKey, ResourceKeyFlat } from './ResourceKey';
import { resourceKeyAlias, ResourceKeyAlias } from './ResourceKeyAlias';
import { isResourceKeyList, ResourceKeyList } from './ResourceKeyList';
import type { ResourceKeyListAlias } from './ResourceKeyListAlias';
import { ResourceKeyUtils } from './ResourceKeyUtils';

export interface ICachedResourceMetadata {
  loaded: boolean;
  outdated: boolean;
  loading: boolean;
  includes: string[];
  exception: Error | null;
  dependencies: string[];
}

export interface IUseData<TKey> {
  id: string | undefined;
  param: ResourceKey<TKey>;
  isInUse: boolean;
}

export interface IDataError<TKey> {
  param: ResourceKey<TKey>;
  exception: Error;
}

export type IParamAlias<TKey> = {
  id: string;
  getAlias: (param: ResourceAlias<TKey, any>) => ResourceKey<TKey>;
};

export type CachedResourceData<TResource> = TResource extends CachedResource<infer T, any, any, any, any> ? T : never;
export type CachedResourceValue<TResource> = TResource extends CachedResource<any, infer T, any, any, any> ? T : never;
export type CachedResourceKey<TResource> = TResource extends CachedResource<any, any, infer T, any, any> ? T : never;
export type CachedResourceContext<TResource> = TResource extends CachedResource<any, any, any, infer T, any> ? T : void;
export type CachedResourceMetadata<TResource> = (
  TResource extends CachedResource<any, any, any, any, infer T>
    ? T
    : void
);

export const CachedResourceParamKey = resourceKeyAlias('@cached-resource/param-default');

export abstract class CachedResource<
  TData,
  TValue,
  TKey,
  TInclude extends ReadonlyArray<string>,
  TMetadata extends ICachedResourceMetadata = ICachedResourceMetadata,
> extends Dependency {
  data: TData;

  get isResourceInUse(): boolean {
    return this.getAllMetadata()
      .some(metadata => metadata.dependencies.length > 0);
  }

  readonly onClear: ISyncExecutor;
  readonly onUse: ISyncExecutor<IUseData<TKey>>;
  readonly onDataOutdated: ISyncExecutor<ResourceKey<TKey>>;
  readonly onDataUpdate: ISyncExecutor<ResourceKey<TKey>>;
  readonly onDataError: ISyncExecutor<IDataError<ResourceKey<TKey>>>;
  readonly beforeLoad: IExecutor<ResourceKey<TKey>>;

  protected metadata: MetadataMap<TKey, TMetadata>;
  protected defaultIncludes: TInclude; // needed for CachedResourceContext

  protected get loading(): boolean {
    return this.scheduler.executing;
  }

  protected scheduler: TaskScheduler<ResourceKey<TKey>>;
  protected paramAliases: Array<IParamAlias<TKey>>;
  protected logActivity: boolean;
  protected outdateWaitList: ResourceKey<TKey>[];

  private readonly typescriptHack: TValue;

  constructor(
    defaultKey: ResourceKey<TKey>,
    private readonly defaultValue: () => TData,
    defaultIncludes: TInclude = [] as any
  ) {
    super();

    this.isKeyEqual = this.isKeyEqual.bind(this);
    this.isIntersect = this.isIntersect.bind(this);
    this.loadingTask = this.loadingTask.bind(this);

    this.logActivity = false;

    this.typescriptHack = null as any;
    this.defaultIncludes = defaultIncludes;
    this.paramAliases = [];
    this.outdateWaitList = [];
    this.metadata = new MetadataMap((key, metadata) => (observable(this.getDefaultMetadata(
      key,
      metadata
    ) as TMetadata, undefined, { deep: false })));
    this.scheduler = new TaskScheduler(this.isIntersect);
    this.data = defaultValue();
    this.beforeLoad = new Executor(null, this.isIntersect);
    this.onClear = new SyncExecutor();
    this.onUse = new SyncExecutor();
    this.onDataOutdated = new SyncExecutor<ResourceKey<TKey>>(null);
    this.onDataUpdate = new SyncExecutor<ResourceKey<TKey>>(null);
    this.onDataError = new SyncExecutor<IDataError<ResourceKey<TKey>>>(null);

    this.onUse.setInitialDataGetter(this.getInitialOnUseData.bind(this));
    this.addAlias(CachedResourceParamKey, () => defaultKey);

    if (this.logActivity) {
      // this.spy(this.beforeLoad, 'beforeLoad');
      // this.spy(this.onDataOutdated, 'onDataOutdated');
      this.spy(this.onDataUpdate, 'onDataUpdate');
      this.spy(this.onDataError, 'onDataError');
    }

    makeObservable<
    this,
    'loader' | 'commitIncludes' | 'resetIncludes' | 'markOutdatedSync'
    >(this, {
      data: observable,
      isResourceInUse: computed,
      loader: action,
      markLoading: action,
      markLoaded: action,
      markError: action,
      markOutdated: action,
      markUpdated: action,
      commitIncludes: action,
      markOutdatedSync: action,
      resetIncludes: action,
      use: action,
      free: action,
      clear: action,
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

    const subscriptionHandler = () => {
      if (resource.isResourceInUse) {
        if (!subscription || !this.hasUseId(subscription)) {
          subscription = this.use(CachedResourceParamKey);
        }
      } else {
        if (subscription) {
          this.free(CachedResourceParamKey, subscription);
          subscription = null;
        }
      }
    };

    resource.onUse.addHandler(subscriptionHandler);
    this.onClear.addHandler(subscriptionHandler);
  }

  sync<T = TKey>(
    resource: CachedResource<any, any, T, any, any>,
    mapTo?: (param: ResourceKey<TKey>) => ResourceKey<T>,
    mapOut?: (param: ResourceKey<T>) => ResourceKey<TKey>
  ): void {
    // TODO: do we want to sync "Clean" action?
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

  updateResource<T = TKey>(
    resource: CachedResource<any, any, T, any, any>,
    map?: (param: ResourceKey<TKey>) => ResourceKey<T>
  ): this {
    this.onDataUpdate.addHandler(param => {
      try {
        if (this.logActivity) {
          console.group(this.getActionPrefixedName(' update - ' + resource.getName()));
        }

        if (map) {
          param = map(param) as ResourceKey<TKey>;
        }

        resource.markUpdated(param as ResourceKey<T>);
      } finally {
        if (this.logActivity) {
          console.groupEnd();
        }
      }
    });

    return this;
  }

  outdateResource<T = TKey>(
    resource: CachedResource<any, any, T, any, any>,
    map?: (param: ResourceKey<TKey>) => ResourceKey<T>
  ): this {
    this.onDataOutdated.addHandler(param => {
      try {
        if (this.logActivity) {
          console.group(this.getActionPrefixedName(' outdate - ' + resource.getName()));
        }

        if (map) {
          param = map(param) as ResourceKey<TKey>;
        }

        resource.markOutdated(param as ResourceKey<T>);
      } finally {
        if (this.logActivity) {
          console.groupEnd();
        }
      }
    });

    return this;
  }

  preloadResource<T = TKey>(
    resource: CachedResource<any, any, T, any, any>,
    map?: (param: ResourceKey<TKey>) => ResourceKey<T>
  ): this {
    resource.connect(this);

    this.beforeLoad.addHandler(async param => {
      try {
        if (this.logActivity) {
          console.group(this.getActionPrefixedName(' preload - ' + resource.getName()));
        }

        if (map) {
          param = map(param) as ResourceKey<TKey>;
        }

        await resource.load(param as ResourceKey<T>);
      } finally {
        if (this.logActivity) {
          console.groupEnd();
        }
      }
    });

    return this;
  }

  before(handler: IExecutorHandler<ResourceKey<TKey>>): this {
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

  isInUse(param: ResourceKey<TKey>): boolean {
    return this.someMetadata(param, metadata => metadata.dependencies.length > 0);
  }

  hasUseId(id: string): boolean {
    return this.getAllMetadata().some(metadata => metadata.dependencies.includes(id));
  }

  use(param: ResourceKey<TKey>, id = uuid()): string {
    this.updateMetadata(param, metadata => {
      metadata.dependencies.push(id);
    });
    if (isResourceAlias(param)) {
      param = this.transformToAlias(param);
    }
    this.onUse.execute({ id, param, isInUse: true });
    if (this.logActivity) {
      console.log('Use resource: ', this.getName(), param);
    }
    return id;
  }

  free(param: ResourceKey<TKey>, id: string): void {
    this.updateMetadata(param, metadata => {
      if (metadata.dependencies.length > 0) {
        metadata.dependencies = metadata.dependencies.filter(v => v !== id);
      }
    });
    if (isResourceAlias(param)) {
      param = this.transformToAlias(param);
    }
    this.onUse.execute({ id, param, isInUse: false });

    if (this.logActivity) {
      console.log('Free resource: ', this.getName(), param);
    }
  }

  isLoaded(param?: ResourceKey<TKey>, includes?: TInclude): boolean {
    if (param === undefined) {
      param = CachedResourceParamKey;
    }

    if (!this.hasMetadata(param)) {
      return false;
    }

    return (
      this.everyMetadata(param, metadata => metadata.loaded)
      && (!includes || this.isIncludes(param, includes))
    );
  }

  isLoadable(param?: ResourceKey<TKey>, context?: TInclude): boolean {
    if (param === undefined) {
      param = CachedResourceParamKey;
    }
    return !this.isLoaded(param, context) || this.isOutdated(param);
  }

  hasAlias(key: ResourceAlias<TKey, any>): boolean {
    return this.paramAliases.some(alias =>  alias.id === key.id);
  }

  isAlias<TOptions extends ResourceAliasOptions = any>(
    key: ResourceKey<TKey>,
    aliasToCompare?: ResourceAlias<TKey, TOptions> | ResourceAliasFactory<TKey, TOptions>
  ): key is ResourceKeyAlias<TKey, TOptions> | ResourceKeyListAlias<TKey, TOptions> {
    if (isResourceAlias(key)) {
      key = this.transformToAlias(key);
      if (this.hasAlias(key)) {
        return (
          aliasToCompare === undefined
          || aliasToCompare.id === key.id
        );
      }
      throw new Error(`Alias ${key.toString()} is not registered in ${this.getName()}`);
    }
    return false;
  }

  waitLoad(): Promise<void> {
    return this.scheduler.wait();
  }

  isLoading(key?: ResourceKey<TKey>): boolean {
    if (key === undefined) {
      key = CachedResourceParamKey;
    }

    return this.someMetadata(key, metadata => metadata.loading);
  }

  isIncludes(key: ResourceKey<TKey>, includes: TInclude): boolean {
    return this.everyMetadata(key, metadata => includes.every(include => metadata.includes.includes(include)));
  }

  hasMetadata(key: ResourceKey<TKey>): boolean {
    if (isResourceKeyList(key)) {
      return key.every(key => this.metadata.has(this.getMetadataKeyRef(key)));
    }

    return this.metadata.has(this.getMetadataKeyRef(key));
  }

  everyMetadata(
    param: ResourceKey<TKey>,
    predicate: (metadata: TMetadata) => boolean
  ): boolean {
    if (!this.hasMetadata(param)) {
      return false;
    }

    return !this.someMetadata(param, key => !predicate(key));
  }

  someMetadata(
    param: ResourceKey<TKey>,
    predicate: (metadata: TMetadata) => boolean
  ): boolean {
    if (!this.hasMetadata(param)) {
      return false;
    }

    if (isResourceKeyList(param)) {
      return param.some(key => predicate(this.getMetadata(key)));
    }

    let result = false;

    if (predicate(this.getMetadata(param))) {
      result = true;
    }

    if (isResourceAlias(param)) {
      param = this.transformToKey(param);

      if (isResourceKeyList(param)) {
        if (this.someMetadata(param, predicate)) {
          result = true;
        }
      }
    }

    return result;
  }

  mapMetadata<TValue>(
    param: ResourceKeyFlat<TKey>,
    map: (metadata: TMetadata | undefined) => TValue
  ): TValue;
  mapMetadata<TValue>(
    param: ResourceKeyList<TKey>,
    map: (metadata: TMetadata | undefined) => TValue
  ): TValue[];
  mapMetadata<TValue>(
    param: ResourceKey<TKey>,
    map: (metadata: TMetadata | undefined) => TValue
  ): TValue | TValue[];
  mapMetadata<TValue>(
    param: ResourceKey<TKey>,
    map: (metadata: TMetadata | undefined) => TValue
  ): TValue | TValue[] {
    const callback = (key: ResourceKeyFlat<TKey>) => {
      if (!this.hasMetadata(key)) {
        return map(undefined);
      }
      return map(this.getMetadata(key));
    };

    if (isResourceKeyList(param)) {
      return param.map(callback);
    }

    return callback(param);
  }

  /**
   * Use it instead of this.metadata.values
   * This method can be override
   */

  getAllMetadata(): TMetadata[] {
    return [...this.metadata.values()];
  }

  /**
   * Use it instead of this.metadata.get
   * This method can be override
   */
  getMetadata(key: ResourceKeyFlat<TKey>): TMetadata;
  getMetadata(key: ResourceKeyList<TKey>): TMetadata[];
  getMetadata(key: ResourceKey<TKey>): TMetadata | TMetadata[];
  getMetadata(key: ResourceKey<TKey>): TMetadata | TMetadata[] {
    if (isResourceKeyList(key)) {
      return key.map(key => this.getMetadata(key));
    }

    return this.metadata.get(this.getMetadataKeyRef(key));
  }

  /**
   * Use to update metadata
   * This method can be override
   */
  updateMetadata(key: ResourceKey<TKey>, callback: (data: TMetadata) => void): void {
    ResourceKeyUtils.forEach(key, key => {
      callback(this.getMetadata(key));
    });
  }

  /**
   * Use it instead of this.metadata.delete
   * This method can be override
   */
  deleteMetadata(param: ResourceKey<TKey>): void {
    ResourceKeyUtils.forEach(param, key => {
      this.metadata.delete(this.getMetadataKeyRef(key));
    });
  }

  getException(param: ResourceKeyFlat<TKey>): Error | null;
  getException(param: ResourceKeyList<TKey>): Error[] | null;
  getException(param: ResourceKey<TKey>): Error[] | Error | null;
  getException(param: ResourceKey<TKey>): Error[] | Error | null {
    if (isResourceKeyList(param)) {
      return this.mapMetadata(param, metadata => metadata?.exception || null)
        .filter<Error>((exception): exception is Error => exception !== null);
    }

    return this.mapMetadata(param, metadata => metadata?.exception || null);
  }

  isOutdated(param?: ResourceKey<TKey>): boolean {
    if (param === undefined) {
      param = CachedResourceParamKey;
    }

    return this.someMetadata(param, metadata => !metadata.loaded || metadata.outdated);
  }

  markLoading(param: ResourceKey<TKey>, state: boolean, context?: TInclude): void {
    this.updateMetadata(param, metadata => {
      metadata.loading = state;
    });
  }

  markLoaded(param: ResourceKey<TKey>, includes?: TInclude): void {
    this.updateMetadata(param, metadata => {
      metadata.loaded = true;
      if (includes) {
        this.commitIncludes(metadata, includes);
      }
    });
  }

  markError(exception: Error, key: ResourceKey<TKey>, include?: TInclude): ResourceError {
    exception = new ResourceError(this, key, include, exception.message, { cause: exception });
    this.updateMetadata(key, metadata => {
      metadata.exception = exception;
      metadata.outdated = false;
    });
    if (isResourceAlias(key)) {
      key = this.transformToAlias(key);
    }
    this.onDataError.execute({ param: key, exception });
    return exception as ResourceError;
  }

  cleanError(param?: ResourceKey<TKey>): void {
    if (param === undefined) {
      param = CachedResourceParamKey;
    }

    this.updateMetadata(param, metadata => {
      metadata.exception = null;
    });
  }

  markOutdated(param?: ResourceKey<TKey>): void {
    if (param === undefined) {
      param = CachedResourceParamKey;
    }

    const isKeyExecuting = (
      param === CachedResourceParamKey
        ? this.scheduler.executing
        : this.scheduler.isExecuting(param)
    );

    if (isKeyExecuting && !this.outdateWaitList.some(key => this.isIntersect(param!, key))) {
      this.outdateWaitList.push(param);
      return;
    }

    this.markOutdatedSync(param);
  }

  markUpdated(param?: ResourceKey<TKey>): void {
    if (param === undefined) {
      param = CachedResourceParamKey;
    }

    this.updateMetadata(param, metadata => {
      metadata.outdated = false;
    });
  }

  dataUpdate(key?: ResourceKey<TKey>): void {
    if (key === undefined) {
      key = CachedResourceParamKey;
    }

    this.cleanError(key);
    if (isResourceAlias(key)) {
      key = this.transformToAlias(key);
    }
    this.onDataUpdate.execute(key);
  }

  addAlias<TOptions extends ResourceAliasOptions>(
    param: ResourceAlias<TKey, TOptions> | ResourceAliasFactory<TKey, TOptions>,
    getAlias: (param: ResourceAlias<TKey, TOptions>) => ResourceKey<TKey>
  ): void {
    this.paramAliases.push({ id: param.id, getAlias });
  }

  replaceAlias<TOptions extends ResourceAliasOptions>(
    param: ResourceAlias<TKey, TOptions> | ResourceAliasFactory<TKey, TOptions>,
    getAlias: (param: ResourceAlias<TKey, TOptions>) => ResourceKey<TKey>
  ): void {
    const indexOf = this.paramAliases.findIndex(aliasInfo => aliasInfo.id === param.id);

    if (indexOf === -1) {
      this.addAlias(param, getAlias);
    } else {
      this.paramAliases.splice(indexOf, 1, { id: param.id, getAlias });
    }
  }

  async refresh(key?: ResourceKey<TKey>, context?: TInclude): Promise<any> {
    if (key === undefined) {
      key = CachedResourceParamKey;
    }
    await this.loadData(key, true, context);
    return this.data;
  }

  async load(key?: ResourceKey<TKey>, context?: TInclude): Promise<any> {
    if (key === undefined) {
      key = CachedResourceParamKey;
    }
    await this.loadData(key, false, context);
    return this.data;
  }

  getIncludes(key?: ResourceKeyFlat<TKey>): ReadonlyArray<string> {
    if (key === undefined) {
      key = CachedResourceParamKey;
    }

    if (!this.hasMetadata(key)) {
      return this.defaultIncludes;
    }

    const metadata = this.getMetadata(key);
    return metadata.includes;
  }

  clear(): void {
    this.clearData();
    this.metadata.clear();
    this.onUse.execute(this.getInitialOnUseData());
    this.onDataUpdate.execute(this.transformToAlias(CachedResourceParamKey));
  }


  /**
   * Converts array of includes to map
   * ```
   * {
   *   customIncludeBase: true,
   *   [key]: true
   * }
   * ```
   * @param key - Resource to extract includes from metadata
   * @param includes - Base includes
   * @returns {Object} Object where key is include name and value is true
   */
  getIncludesMap(
    key?: ResourceKeyFlat<TKey>,
    includes: ReadonlyArray<string> = this.defaultIncludes
  ): Record<string, any> {
    const keyIncludes = this.getIncludes(key);
    return ['customIncludeBase', ...includes, ...keyIncludes].reduce<any>((map, key) => {
      map[key] = true;

      return map;
    }, {});
  }

  /**
   * Can be override to provide equality check for complicated keys
   */
  isKeyEqual(param: TKey, second: TKey): boolean {
    return param === second;
  }

  /**
   * Check if key is a part of param
   * @param param - param
   * @param key - key
   * @returns {boolean} Returns true if param can be represented by key
   */
  isIntersect(key: ResourceKey<TKey>, nextKey: ResourceKey<TKey>): boolean {
    if (key === nextKey) {
      return true;
    }

    if (isResourceAlias(key) && isResourceAlias(nextKey)) {
      key = this.transformToAlias(key);
      nextKey = this.transformToAlias(nextKey);
      return key.isEqual(nextKey);
    } else if (isResourceAlias(key) || isResourceAlias(nextKey)) {
      return true;
    }

    if (isResourceKeyList(key) || isResourceKeyList(nextKey)) {
      return ResourceKeyUtils.isIntersect(key, nextKey, this.isKeyEqual);
    }

    return ResourceKeyUtils.isIntersect(key, nextKey, this.isKeyEqual);
  }

  /**
   * Can be override to provide static link to complicated keys
   */
  protected getKeyRef(key: TKey): TKey {
    return Object.freeze(toJS(key));
  }

  /**
   * Can be override to provide static link to complicated keys
   */
  protected getMetadataKeyRef(key: ResourceKeyFlat<TKey>): TKey {
    if (this.isAlias(key)) {
      return this.transformToAlias(key)
        .toString() as TKey;
    }

    const ref = Array.from(this.metadata.keys())
      .find(k => this.isKeyEqual(k, key));

    if (ref) {
      return ref;
    }

    return this.getKeyRef(key);
  }

  protected transformToKey(param: ResourceKey<TKey>): TKey | ResourceKeyList<TKey> {
    let deep = 0;

    while (deep < 10) {
      if (!this.validateResourceKey(param)) {
        let paramString = JSON.stringify(toJS(param));

        if (isResourceKeyList(param))  {
          paramString = param.toString();
        }
        console.warn(this.getActionPrefixedName(`wrong param "${paramString}"`));
      }

      if (isResourceAlias(param)) {
        for (const alias of this.paramAliases) {
          if (alias.id === param.id) {
            param = alias.getAlias(param);
            deep++;
            break;
          }
        }
      } else {
        break;
      }
    }

    if (deep === 10) {
      console.warn(this.getActionPrefixedName('parameter transform was stopped'));
    }

    if (isResourceAlias(param)) {
      throw new Error(this.getActionPrefixedName(`Can't resolve alias ${param.toString()}`));
    }
    return param;
  }

  // TODO: add information about original alias for debugging
  protected transformToAlias(
    key: ResourceKeyAlias<TKey, any> | ResourceKeyListAlias<TKey, any>
  ): ResourceKeyAlias<TKey, any> | ResourceKeyListAlias<TKey, any> {
    let deep = 0;
    // eslint-disable-next-line no-labels
    transform:

    if (deep < 10) {
      if (!this.validateResourceKey(key)) {
        let paramString = JSON.stringify(toJS(key));

        if (isResourceKeyList(key) || isResourceAlias(key))  {
          paramString = key.toString();
        }
        console.warn(this.getActionPrefixedName(`wrong param "${paramString}"`));
      }

      for (const alias of this.paramAliases) {
        if (alias.id === key.id) {
          const data = alias.getAlias(key);

          if (isResourceAlias(data)) {
            key = data;
          } else {
            return key;
          }
          deep++;
          // eslint-disable-next-line no-labels
          break transform;
        }
      }
    } else {
      console.warn('CachedResource: parameter transform was stopped');
    }
    return key;
  }

  protected validateResourceKey(param: ResourceKey<TKey>): boolean {
    if (isResourceAlias(param)) {
      return this.hasAlias(param);
    }

    if (isResourceKeyList(param)) {
      return (
        param.length === 0
        || param.every(this.validateKey.bind(this))
      );
    }
    return this.validateKey(param);
  }

  protected abstract validateKey(key: TKey): boolean;

  protected resetIncludes(): void {
    for (const metadata of this.getAllMetadata()) {
      metadata.includes = observable([...this.defaultIncludes]);
    }
  }

  protected commitIncludes(metadata: TMetadata, includes: ReadonlyArray<string>): void {
    for (const include of includes) {
      if (!metadata.includes.includes(include)) {
        metadata.includes.push(include);
      }
    }
  }

  protected clearData(): void {
    this.setData(this.defaultValue());
  }

  protected setData(data: TData): void {
    this.data = data;
  }

  protected markOutdatedSync(key: ResourceKey<TKey>): void {
    this.updateMetadata(key, metadata => {
      metadata.outdated = true;
    });
    if (isResourceAlias(key)) {
      key = this.transformToAlias(key);
    }
    this.onDataOutdated.execute(key);
  }

  protected getInitialOnUseData(): IUseData<TKey> {
    return ({
      id: undefined,
      param: CachedResourceParamKey,
      isInUse: false,
    });
  }
  /**
   * Use to extend metadata
   * @returns {Record<string, any>} Object Map
   */
  protected getDefaultMetadata(
    key: TKey,
    metadata: MetadataMap<TKey, TMetadata>
  ): ICachedResourceMetadata {
    return {
      loaded: false,
      outdated: true,
      loading: false,
      exception: null,
      includes: observable([...this.defaultIncludes]),
      dependencies: observable([]),
    };
  }

  protected async preLoadData(
    param: ResourceKey<TKey>,
    contexts: IExecutionContextProvider<ResourceKey<TKey>>,
    refresh: boolean,
    context?: TInclude,
  ): Promise<void> { }

  protected abstract loader(
    param: ResourceKey<TKey>,
    include: ReadonlyArray<string> | undefined,
    refresh: boolean
  ): Promise<TData>;

  protected async performUpdate<T>(
    key: ResourceKey<TKey>,
    include: TInclude | undefined,
    update: (key: ResourceKey<TKey>, context?: ReadonlyArray<string>) => Promise<T>,
  ): Promise<T>;
  protected async performUpdate<T>(
    key: ResourceKey<TKey>,
    include: TInclude | undefined,
    update: (key: ResourceKey<TKey>, context?: ReadonlyArray<string>) => Promise<T>,
    exitCheck: (key: ResourceKey<TKey>, context?: ReadonlyArray<string>) => boolean
  ): Promise<T | undefined>;
  protected async performUpdate<T>(
    key: ResourceKey<TKey>,
    include: TInclude | undefined,
    update: (key: ResourceKey<TKey>, context?: ReadonlyArray<string>) => Promise<T>,
    exitCheck?: (key: ResourceKey<TKey>, context?: ReadonlyArray<string>) => boolean
  ): Promise<T | undefined> {
    if (isResourceAlias(key)) {
      key = this.transformToAlias(key);
    }
    const context = new ExecutionContext(key);
    await this.preLoadData(key, context, true, include);
    await this.beforeLoad.execute(key, context);

    if (ExecutorInterrupter.isInterrupted(context)) {
      return;
    }

    await this.scheduler.waitRelease(key);

    if (exitCheck?.(key, include)) {
      return;
    }

    let loaded = false;
    return this.scheduler.schedule(
      key,
      async () => {
        // repeated because previous task maybe has been load requested data
        if (exitCheck?.(key, include)) {
          return;
        }

        this.markLoading(key, true, include);
        try {
          const result = await this.taskWrapper(key, include, true, update);
          loaded = true;
          return result;
        } finally {
          this.markLoading(key, false, include);
        }
      },
      {
        before: () => {
          this.markOutdatedSync(key);
        },
        success: () => {
          if (loaded) {
            this.dataUpdate(key);
          }
        },
        error: exception => this.markError(exception, key, include),
      });
  }

  protected async loadData(
    key: ResourceKey<TKey>,
    refresh: boolean,
    include?: TInclude
  ): Promise<void> {
    if (isResourceAlias(key)) {
      key = this.transformToAlias(key);
    }
    const contexts = new ExecutionContext(key);
    if (!refresh) {
      if (!this.isLoadable(key, include)) {
        return;
      }

      await this.scheduler.waitRelease(key);

      if (!this.isLoadable(key, include)) {
        return;
      }
    }

    await this.preLoadData(key, contexts, refresh, include);
    await this.beforeLoad.execute(key, contexts);

    if (ExecutorInterrupter.isInterrupted(contexts)) {
      return;
    }

    let loaded = false;
    await this.scheduler.schedule(
      key,
      async () => {
        // repeated because previous task maybe has been load requested data
        if (!refresh && !this.isLoadable(key, include)) {
          return;
        }

        this.markLoading(key, true, include);
        try {
          const result = await this.taskWrapper(key, include, refresh, this.loadingTask);
          loaded = true;
          this.markLoaded(key, include);
          return result;
        } finally {
          this.markLoading(key, false, include);
        }
      },
      {
        before: () => {
          if (refresh) {
            this.markOutdatedSync(key);
          }
        },
        success: async () => {
          if (loaded) {
            this.dataUpdate(key);
          }
        },
        error: exception => this.markError(exception, key, include),
      });
  }

  private async loadingTask(
    param: ResourceKey<TKey>,
    context: ReadonlyArray<string> | undefined,
    refresh: boolean
  ) {
    this.setData(await this.loader(param, context, refresh));
  }

  private async taskWrapper<T>(
    param: ResourceKey<TKey>,
    context: ReadonlyArray<string> | undefined,
    refresh: boolean,
    promise: (
      param: ResourceKey<TKey>,
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
