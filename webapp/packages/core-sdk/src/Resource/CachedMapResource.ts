/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, computed, makeObservable, observable } from 'mobx';

import { ISyncExecutor, SyncExecutor } from '@cloudbeaver/core-executor';
import { ILoadableState, isArraysEqual, isContainsException, MetadataMap, uuid } from '@cloudbeaver/core-utils';

import { CachedResource, CachedResourceKey, CachedResourceParamKey, ICachedResourceMetadata } from './CachedResource';
import type { CachedResourceIncludeArgs, CachedResourceValueIncludes } from './CachedResourceIncludes';
import { ResourceKey, resourceKeyList, ResourceKeyList, ResourceKeyUtils } from './ResourceKeyList';

export type CachedMapResourceKey<TResource> = CachedResourceKey<TResource>;
export type CachedMapResourceValue<TResource> = TResource extends CachedResource<Map<any, infer T>, any, any, any, any>
  ? T
  : never;
export type CachedMapResourceArguments<TResource> = TResource extends CachedMapResource<any, any, infer T> ? T : never;

export type CachedMapResourceListGetter<
  TValue,
  TIncludes
> = Array<CachedMapResourceGetter<TValue, TIncludes>>;

export type CachedMapResourceGetter<
  TValue,
  TIncludes
> = CachedResourceValueIncludes<TValue, TIncludes> | undefined;

export type CachedMapResourceLoader<
  TRealKey,
  TKey,
  TValue,
  TIncludes
> = TRealKey extends ResourceKeyList<TKey>
  ? Array<CachedResourceValueIncludes<TValue, TIncludes>>
  : CachedResourceValueIncludes<TValue, TIncludes>;

export interface ICachedMapResourceMetadata extends ICachedResourceMetadata {
  includes: string[];
}

export const CachedMapAllKey = resourceKeyList<any>([Symbol('@cached-map-resource/all')], 'all');
export const CachedMapEmptyKey = resourceKeyList<any>([], 'empty');

export abstract class CachedMapResource<
  TKey,
  TValue,
  TContext extends Record<string, any> = Record<string, never>
> extends CachedResource<
  Map<TKey, TValue>,
  TValue,
  ResourceKey<TKey>,
  TKey,
  CachedResourceIncludeArgs<TValue, TContext>
  > {
  readonly onItemAdd: ISyncExecutor<ResourceKey<TKey>>;
  readonly onItemDelete: ISyncExecutor<ResourceKey<TKey>>;
  protected metadata: MetadataMap<TKey, ICachedMapResourceMetadata>;

  get values(): TValue[] {
    return Array.from(this.data.values());
  }

  get keys(): TKey[] {
    return Array.from(this.data.keys());
  }

  constructor(
    defaultValue?: Map<TKey, TValue>,
    defaultIncludes?: CachedResourceIncludeArgs<TValue, TContext>
  ) {
    super(defaultValue || new Map(), defaultIncludes);
    this.onItemAdd = new SyncExecutor<ResourceKey<TKey>>(null);
    this.onItemDelete = new SyncExecutor<ResourceKey<TKey>>(null);

    this.metadata = new MetadataMap((key, metadata) => observable({
      outdated: true,
      loading: false,
      exception: null,
      includes: observable([...this.defaultIncludes]),
      dependencies: observable([]),
      ...this.populateMetadata(key, metadata),
    }, undefined, { deep: false }));

    this.addAlias(CachedMapAllKey, key => {
      if (this.keys.length > 0) {
        return resourceKeyList(this.keys, CachedMapAllKey.mark);
      }
      return resourceKeyList([]);
    });

    makeObservable<this, 'dataSet' | 'dataDelete'>(this, {
      set: action,
      delete: action,
      clear: action,
      dataSet: action,
      dataDelete: action,
      values: computed<TValue[]>({
        equals: isArraysEqual,
      }),
      keys: computed<TKey[]>({
        equals: isArraysEqual,
      }),
    });
  }

  deleteInResource<T = TKey>(
    resource: CachedMapResource<T, any, any>,
    map?: (key: ResourceKey<TKey>) => ResourceKey<T>
  ): this {
    this.onItemDelete.addHandler(param => {
      try {
        if (this.logActivity) {
          console.group(this.getActionPrefixedName(' outdate - ' + resource.getName()));
        }

        if (map) {
          param = map(param) as any as TKey;
        }

        resource.delete(param as any as T);
      } finally {
        if (this.logActivity) {
          console.groupEnd();
        }
      }
    });

    return this;
  }

  isIncludes(key: ResourceKey<TKey>, includes: CachedResourceIncludeArgs<TValue, TContext>): boolean {
    key = this.transformParam(key);
    return ResourceKeyUtils.every(key, key => {
      const metadata = this.getMetadata(key);

      return includes.every(include => metadata.includes.includes(include));
    });
  }

  getException(key: TKey): Error | null;
  getException(key: ResourceKeyList<TKey>): Array<Error | null>;
  getException(key: ResourceKey<TKey>): Array<Error | null> | Error | null;
  getException(key: ResourceKey<TKey>): Array<Error | null> | Error | null {
    key = this.transformParam(key);
    return ResourceKeyUtils.map(key, key => this.getMetadata(key).exception);
  }

  isInUse(key: ResourceKey<TKey>): boolean {
    return ResourceKeyUtils.every(key, key => super.isInUse(this.getMetadataKeyRef(key)));
  }

  use(key: ResourceKey<TKey> | typeof CachedResourceParamKey): string {
    const id = uuid();

    if (key === CachedResourceParamKey) {
      super.use(CachedResourceParamKey, id);
      return id;
    }

    key = this.transformParam(key);
    key = this.getLockedKeys(key);

    ResourceKeyUtils.map(key, key => {
      key = this.getMetadataKeyRef(key);
      return super.use(key, id);
    });

    return id;
  }

  free(key: ResourceKey<TKey> | typeof CachedResourceParamKey, id: string): void {
    if (key === CachedResourceParamKey) {
      super.free(CachedResourceParamKey, id);
      return;
    }

    key = this.transformParam(key);
    key = this.getLockedKeys(key);

    ResourceKeyUtils.forEach(key, (key, i) => {
      key = this.getMetadataKeyRef(key);
      super.free(key, id);
    });
  }

  isOutdated(key?: ResourceKey<TKey>): boolean {
    if (key === undefined) {
      return (
        Array.from(this.metadata.values()).some(metadata => metadata.outdated)
        && this.loadedKeys.length === 0
      );
    }

    if (this.isAlias(key) && !this.isAliasLoaded(key)) {
      return true;
    }

    key = this.transformParam(key);
    return ResourceKeyUtils.some(key, key => {
      const metadata = this.getMetadata(key);

      return metadata.outdated;
    });
  }

  isDataLoading(key: ResourceKey<TKey>): boolean {
    key = this.transformParam(key);
    return ResourceKeyUtils.some(key, key => this.getMetadata(key).loading);
  }

  markDataLoading(key: ResourceKey<TKey>, includes?: CachedResourceIncludeArgs<TValue, TContext>): void {
    key = this.transformParam(key);
    ResourceKeyUtils.forEach(key, key => {
      this.updateMetadata(key, metadata => {
        metadata.loading = true;
      });
    });
  }

  markDataLoaded(key: ResourceKey<TKey>, includes?: CachedResourceIncludeArgs<TValue, TContext>): void {
    key = this.transformParam(key);

    if (includes) {
      this.commitIncludes(key, includes);
    }

    ResourceKeyUtils.forEach(key, key => {
      this.updateMetadata(key, metadata => {
        metadata.loading = false;
      });
    });
  }

  markDataError(exception: Error, key: ResourceKey<TKey>): void {
    if (this.isAlias(key) && !this.isAliasLoaded(key)) {
      this.loadedKeys.push(key);
    }
    key = this.transformParam(key);

    ResourceKeyUtils.forEach(key, key => {
      this.updateMetadata(key, metadata => {
        metadata.exception = exception;
        metadata.outdated = false;
      });
    });

    this.onDataError.execute({ param: key, exception });
  }

  markOutdated(): void;
  markOutdated(key: ResourceKey<TKey>): void;
  markOutdated(key?: ResourceKey<TKey>): void {
    const isKeyExecuting = key === undefined ? this.scheduler.executing : this.scheduler.isExecuting(key);
    if (
      isKeyExecuting
      && !this.outdateWaitList.some(param => this.includes(key!, param))
    ) {
      this.outdateWaitList.push(key!);
      return;
    }

    this.markOutdatedSync(key!);
  }

  cleanError(): void;
  cleanError(key: ResourceKey<TKey>): void;
  cleanError(key?: ResourceKey<TKey>): void {
    if (key === undefined) {
      key = CachedMapAllKey;
    }

    key = this.transformParam(key);

    ResourceKeyUtils.forEach(key, key => {
      this.updateMetadata(key, metadata => {
        metadata.exception = null;
      });
    });
  }

  markUpdated(): void;
  markUpdated(key: ResourceKey<TKey>): void;
  markUpdated(key?: ResourceKey<TKey>): void {
    if (key === undefined) {
      key = CachedMapAllKey;
    }

    if (this.isAlias(key) && !this.isAliasLoaded(key)) {
      this.loadedKeys.push(key);
    }

    key = this.transformParam(key);

    ResourceKeyUtils.forEach(key, key => {
      this.updateMetadata(key, metadata => {
        metadata.outdated = false;
      });
    });
  }

  isLoaded(
    key: ResourceKey<TKey>,
    includes?: CachedResourceIncludeArgs<TValue, TContext>
  ): boolean {
    if (this.isAlias(key) && !this.isAliasLoaded(key)) {
      return false;
    }

    key = this.transformParam(key);
    return ResourceKeyUtils.every(key, key => {
      if (!this.has(key)) {
        return false;
      }

      if (includes) {
        const metadata = this.getMetadata(key);

        if (includes.some(include => !metadata.includes.includes(include))) {
          return false;
        }
      }
      return true;
    });
  }

  has(key: ResourceKey<TKey>): boolean {
    if (this.isAlias(key) && !this.isAliasLoaded(key)) {
      return false;
    }

    key = this.transformParam(key) as TKey;
    return ResourceKeyUtils.every(key, key => this.dataHas(key));
  }

  get(key: TKey): TValue | undefined;
  get(key: ResourceKeyList<TKey>): Array<TValue | undefined>;
  get(key: ResourceKey<TKey>): Array<TValue | undefined> | TValue | undefined;
  get(key: ResourceKey<TKey>): Array<TValue | undefined> | TValue | undefined {
    key = this.transformParam(key);
    return ResourceKeyUtils.map(key, key => this.dataGet(key));
  }

  set(key: TKey, value: TValue): void;
  set(key: ResourceKeyList<TKey>, value: TValue[]): void;
  set(key: ResourceKey<TKey>, value: TValue | TValue[]): void;
  set(key: ResourceKey<TKey>, value: TValue | TValue[]): void {
    key = this.transformParam(key);
    ResourceKeyUtils.forEach(key, (key, i) => {
      if (i === -1) {
        this.dataSet(key, value as TValue);
      } else {
        this.dataSet(key, (value as TValue[])[i]);
      }
    });
    this.markUpdated(key);
    this.onItemAdd.execute(key);
  }

  delete(key: ResourceKey<TKey>): void {
    key = this.transformParam(key);

    this.onItemDelete.execute(key);
    ResourceKeyUtils.forEach(key, key => {
      this.dataDelete(key);
    });
    // rewrites pending outdate
    // this.markUpdated(key);
  }

  clear(): void {
    this.data.clear();

    const keys = Array.from(this.metadata.keys())
      .filter(key => key !== CachedResourceParamKey);

    for (const key of keys) {
      this.metadata.delete(key);
    }
  }

  async refresh<T extends CachedResourceIncludeArgs<TValue, TContext>>(
    key: TKey,
    includes?: T
  ): Promise<CachedResourceValueIncludes<TValue, T>>;
  async refresh<T extends CachedResourceIncludeArgs<TValue, TContext>>(
    key: ResourceKeyList<TKey>,
    includes?: T
  ): Promise<Array<CachedResourceValueIncludes<TValue, T>>>;
  async refresh<T extends CachedResourceIncludeArgs<TValue, TContext>>(
    key: ResourceKey<TKey>,
    includes?: T
  ): Promise<Array<CachedResourceValueIncludes<TValue, T>> | CachedResourceValueIncludes<TValue, T>>;
  async refresh<T extends CachedResourceIncludeArgs<TValue, TContext>>(
    key: ResourceKey<TKey>,
    includes?: T
  ): Promise<Array<CachedResourceValueIncludes<TValue, T>> | CachedResourceValueIncludes<TValue, T>> {
    await this.preLoadData(key, false, includes);
    await this.loadData(key, true, includes);
    return this.get(key) as Array<CachedResourceValueIncludes<TValue, T>> | CachedResourceValueIncludes<TValue, T>;
  }

  async load<T extends CachedResourceIncludeArgs<TValue, TContext>>(
    key: TKey,
    includes?: T
  ): Promise<CachedResourceValueIncludes<TValue, T>>;
  async load<T extends CachedResourceIncludeArgs<TValue, TContext>>(
    key: ResourceKeyList<TKey>,
    includes?: T
  ): Promise<Array<CachedResourceValueIncludes<TValue, T>>>;
  async load<T extends CachedResourceIncludeArgs<TValue, TContext>>(
    key: ResourceKey<TKey>,
    includes?: T
  ): Promise<Array<CachedResourceValueIncludes<TValue, T>> | CachedResourceValueIncludes<TValue, T>>;
  async load<T extends CachedResourceIncludeArgs<TValue, TContext>>(
    key: ResourceKey<TKey>,
    includes?: T
  ): Promise<Array<CachedResourceValueIncludes<TValue, T>> | CachedResourceValueIncludes<TValue, T>> {
    await this.preLoadData(key, false, includes);
    await this.loadData(key, false, includes);
    return this.get(key) as Array<CachedResourceValueIncludes<TValue, T>> | CachedResourceValueIncludes<TValue, T>;
  }

  /**
   * Check if key is a part of param
   * @param param - param
   * @param key - key
   * @returns {boolean} Returns true if param can be represented by key
   */
  includes(param: ResourceKey<TKey>, key: ResourceKey<TKey>): boolean {
    if
    (
      this.isAliasEqual(param, key)
      || (ResourceKeyUtils.isEmpty(param) && ResourceKeyUtils.isEmpty(key))
    ) {
      return true;
    }

    if (this.isAlias(param) || this.isAlias(key)) {
      return true;
    }

    param = ResourceKeyUtils.mapKey(param, this.getKeyRef.bind(this));
    key = ResourceKeyUtils.mapKey(key, this.getKeyRef.bind(this));

    return ResourceKeyUtils.includes(param, key, this.isKeyEqual);
  }

  getIncludes(key?: ResourceKey<TKey>): ReadonlyArray<string> {
    if (key === undefined) {
      return this.defaultIncludes;
    }
    key = this.transformParam(key);

    const metadata = this.getMetadata(ResourceKeyUtils.first(key));

    return metadata.includes;
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
    key?: ResourceKey<TKey>,
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
   * Use it instead of this.metadata.get
   * This method can be override
   */
  getMetadata(param: TKey): ICachedMapResourceMetadata {
    const metadata = this.metadata.get(this.getMetadataKeyRef(param));
    return metadata;
  }

  /**
   * Use to update metadata
   * This method can be override
   */
  updateMetadata(param: TKey, callback: (data: ICachedMapResourceMetadata) => void): void {
    const metadata = this.getMetadata(param);
    callback(metadata);
  }

  /**
   * Use it instead of this.metadata.delete
   * This method can be override
   */
  deleteMetadata(key: TKey): void {
    key = this.getMetadataKeyRef(key);
    this.metadata.delete(key);
  }

  /**
   * Can be override to provide static link to complicated keys
   */
  getMetadataKeyRef(key: TKey): TKey {
    return this.getKeyRef(key);
  }

  /**
   * Can be override to provide static link to complicated keys
   */
  getKeyRef(key: TKey): TKey {
    return key;
  }

  protected getLockedKeys(key: ResourceKey<TKey>): ResourceKey<TKey> {
    return key;
  }

  /**
   * Use to extend metadata
   * @returns {Record<string, any>} Object Map
   */
  protected populateMetadata(key: TKey, metadata: MetadataMap<TKey, ICachedMapResourceMetadata>): Record<string, any> {
    return {};
  }

  /**
   * Use it instead of this.data.get
   * This method can be override
   */
  protected dataGet(key: TKey): TValue | undefined {
    key = this.getKeyRef(key);
    return this.data.get(key);
  }

  /**
   * Use it instead of this.data.set
   * This method can be override
   */
  protected dataSet(key: TKey, value: TValue): void {
    key = this.getKeyRef(key);
    this.data.set(key, value);
  }

  /**
   * Use it instead of this.data.delete
   * This method can be override
   */
  protected dataDelete(key: TKey): void {
    this.data.delete(this.getKeyRef(key));
    this.deleteMetadata(key);
  }

  /**
   * Use it instead of this.data.has
   * This method can be override
   */
  protected dataHas(key: TKey): boolean {
    key = this.getKeyRef(key);
    return this.data.has(key);
  }

  protected commitIncludes(key: ResourceKey<TKey>, includes: CachedResourceIncludeArgs<TValue, TContext>): void {
    key = this.transformParam(key);
    ResourceKeyUtils.forEach(key, key => {
      this.updateMetadata(key, metadata => {
        for (const include of includes) {
          if (!metadata.includes.includes(include)) {
            metadata.includes.push(include);
          }
        }
      });
    });
  }

  protected markOutdatedSync(): void;
  protected markOutdatedSync(key: ResourceKey<TKey>): void;
  protected markOutdatedSync(key?: ResourceKey<TKey>): void {
    if (key === undefined) {
      key = ResourceKeyUtils.join(resourceKeyList(this.keys), ...this.loadedKeys.map(key => this.transformParam(key)));
      this.loadedKeys = [];
      this.resetIncludes();
    } else {
      if (this.isAlias(key)) {
        const index = this.loadedKeys.findIndex(loadedKey => this.isAliasEqual(key!, loadedKey));

        if (index >= 0) {
          this.loadedKeys.splice(index, 1);
        }
      }

      key = this.transformParam(key);
    }

    ResourceKeyUtils.forEach(key, key => {
      this.updateMetadata(key, metadata => {
        metadata.outdated = true;
      });
    });

    this.onDataOutdated.execute(key);
  }
}

export function getCachedMapResourceLoaderState<
  TKey,
  TValue,
  TContext extends Record<string, any> = Record<string, never>
>(
  resource: CachedMapResource<TKey, TValue, TContext>,
  key: ResourceKey<TKey>,
  includes?: CachedResourceIncludeArgs<TValue, TContext> | undefined
): ILoadableState {
  return {
    get exception() {
      return resource.getException(key);
    },
    isLoading() {
      return resource.isDataLoading(key);
    },
    isLoaded() {
      return resource.isLoaded(key, includes);
    },
    isError() {
      return isContainsException(this.exception);
    },
    isOutdated() {
      return resource.isOutdated(key);
    },
    load() {
      return resource.load(key, includes);
    },
    reload() {
      return resource.refresh(key, includes);
    },
  };
}
