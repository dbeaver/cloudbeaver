/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, computed, makeObservable } from 'mobx';

import { ISyncExecutor, SyncExecutor } from '@cloudbeaver/core-executor';
import { ILoadableState, isArraysEqual, isContainsException } from '@cloudbeaver/core-utils';

import { CachedResource, CachedResourceKey, ICachedResourceMetadata } from './CachedResource';
import type { CachedResourceIncludeArgs, CachedResourceValueIncludes } from './CachedResourceIncludes';
import type { ResourceKey, ResourceKeySimple } from './ResourceKey';
import type { ResourceKeyAlias } from './ResourceKeyAlias';
import { isResourceKeyList, resourceKeyList, ResourceKeyList } from './ResourceKeyList';
import { ResourceKeyListAlias, resourceKeyListAlias } from './ResourceKeyListAlias';
import { ResourceKeyUtils } from './ResourceKeyUtils';

export type CachedMapResourceKey<TResource> = CachedResourceKey<TResource>;
export type CachedMapResourceValue<TResource> = TResource extends CachedResource<Map<any, infer T>, any, any, any>
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

export const CachedMapAllKey = resourceKeyListAlias('@cached-map-resource/all');
export const CachedMapEmptyKey = resourceKeyListAlias('@cached-map-resource/empty');

export abstract class CachedMapResource<
  TKey,
  TValue,
  TContext extends Record<string, any> = Record<string, never>,
  TMetadata extends ICachedResourceMetadata = ICachedResourceMetadata,
> extends CachedResource<
  Map<TKey, TValue>,
  TValue,
  TKey,
  CachedResourceIncludeArgs<TValue, TContext>,
  TMetadata
  > {
  readonly onItemUpdate: ISyncExecutor<ResourceKeySimple<TKey>>;
  readonly onItemDelete: ISyncExecutor<ResourceKeySimple<TKey>>;

  get values(): TValue[] {
    return Array.from(this.data.values());
  }

  get keys(): TKey[] {
    return Array.from(this.data.keys());
  }

  constructor(
    defaultValue?: () => Map<TKey, TValue>,
    defaultIncludes?: CachedResourceIncludeArgs<TValue, TContext>
  ) {
    super(CachedMapAllKey, defaultValue || (() => new Map()), defaultIncludes);
    this.onItemUpdate = new SyncExecutor<ResourceKeySimple<TKey>>(null);
    this.onItemDelete = new SyncExecutor<ResourceKeySimple<TKey>>(null);

    this.addAlias(CachedMapAllKey, () => resourceKeyList(this.keys));

    makeObservable<this, 'dataSet' | 'dataDelete'>(this, {
      set: action,
      delete: action,
      replace: action,
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

  has(key: ResourceKey<TKey>): boolean {
    if (
      this.isAlias(key)
       && (!this.hasMetadata(key) || this.isLoaded(key))
    ) {
      return false;
    }

    key = this.transformToKey(key);
    return ResourceKeyUtils.every(key, key => this.dataHas(this.getKeyRef(key)));
  }

  get(key: TKey | ResourceKeyAlias<TKey, any>): TValue | undefined;
  get(key: ResourceKeyList<TKey> | ResourceKeyListAlias<TKey, any>): Array<TValue | undefined>;
  get(key: ResourceKey<TKey>): Array<TValue | undefined> | TValue | undefined;
  get(key: ResourceKey<TKey>): Array<TValue | undefined> | TValue | undefined {
    key = this.transformToKey(key);
    return ResourceKeyUtils.map(key, key => this.dataGet(this.getKeyRef(key)));
  }

  set(key: TKey | ResourceKeyAlias<TKey, any>, value: TValue): void;
  set(key: ResourceKeyList<TKey> | ResourceKeyListAlias<TKey, any>, value: TValue[]): void;
  set(key: ResourceKey<TKey>, value: TValue | TValue[]): void;
  set(originalKey: ResourceKey<TKey>, value: TValue | TValue[]): void {
    const key = this.transformToKey(originalKey);

    if (isResourceKeyList(key)) {
      if (key.length === 0) {
        return;
      }

      for (let i = 0; i < key.length; i++) {
        this.dataSet(this.getKeyRef(key[i]), (value as TValue[])[i]);
      }
    } else {
      this.dataSet(this.getKeyRef(key), value as TValue);
    }
    this.markUpdated(key);
    this.markLoaded(key);
    this.cleanError(key);
    this.onItemUpdate.execute(key);
  }

  replace(keys: ResourceKeyList<TKey>, values: TValue[]): void {
    this.delete(resourceKeyList(this.keys.filter(key => !keys.includes(key))));
    this.set(keys, values);
  }

  delete(originalKey: ResourceKey<TKey>): void {
    const key = this.transformToKey(originalKey);

    if (isResourceKeyList(key) && key.length === 0) {
      return;
    }

    this.onItemDelete.execute(key);
    ResourceKeyUtils.forEach(key, key => {
      this.dataDelete(this.getKeyRef(key));
    });
    this.deleteMetadata(originalKey);
    // rewrites pending outdate
    // this.markUpdated(key);
  }

  async refresh<T extends CachedResourceIncludeArgs<TValue, TContext> = []>(
    key: TKey | ResourceKeyAlias<TKey, any>,
    includes?: T
  ): Promise<CachedResourceValueIncludes<TValue, T>>;
  async refresh<T extends CachedResourceIncludeArgs<TValue, TContext> = []>(
    key?: ResourceKeyList<TKey> | ResourceKeyListAlias<TKey, any> | void,
    includes?: T
  ): Promise<Array<CachedResourceValueIncludes<TValue, T>>>;
  async refresh<T extends CachedResourceIncludeArgs<TValue, TContext> = []>(
    key: ResourceKey<TKey>,
    includes?: T
  ): Promise<Array<CachedResourceValueIncludes<TValue, T>> | CachedResourceValueIncludes<TValue, T>>;
  async refresh<T extends CachedResourceIncludeArgs<TValue, TContext> = []>(
    key?: ResourceKey<TKey> | void,
    includes?: T
  ): Promise<Array<CachedResourceValueIncludes<TValue, T>> | CachedResourceValueIncludes<TValue, T>> {
    if (key === undefined) {
      key = CachedMapAllKey;
    }
    await this.loadData(key, true, includes);
    return this.get(key) as Array<CachedResourceValueIncludes<TValue, T>> | CachedResourceValueIncludes<TValue, T>;
  }

  async load<T extends CachedResourceIncludeArgs<TValue, TContext> = []>(
    key: TKey | ResourceKeyAlias<TKey, any>,
    includes?: T
  ): Promise<CachedResourceValueIncludes<TValue, T>>;
  async load<T extends CachedResourceIncludeArgs<TValue, TContext> = []>(
    key?: ResourceKeyList<TKey> | ResourceKeyListAlias<TKey, any> | void,
    includes?: T
  ): Promise<Array<CachedResourceValueIncludes<TValue, T>>>;
  async load<T extends CachedResourceIncludeArgs<TValue, TContext> = []>(
    key: ResourceKey<TKey>,
    includes?: T
  ): Promise<Array<CachedResourceValueIncludes<TValue, T>> | CachedResourceValueIncludes<TValue, T>>;
  async load<T extends CachedResourceIncludeArgs<TValue, TContext> = []>(
    key?: ResourceKey<TKey> | void,
    includes?: T
  ): Promise<Array<CachedResourceValueIncludes<TValue, T>> | CachedResourceValueIncludes<TValue, T>> {
    if (key === undefined) {
      key = CachedMapAllKey;
    }
    await this.loadData(key, false, includes);
    return this.get(key) as Array<CachedResourceValueIncludes<TValue, T>> | CachedResourceValueIncludes<TValue, T>;
  }

  getKeyRef(key: TKey): TKey {
    if (this.keys.includes(key)) {
      return key;
    }

    const ref = this.keys.find(k => this.isKeyEqual(k, key));

    if (ref) {
      return ref;
    }

    return super.getKeyRef(key);
  }

  /**
   * Use it instead of this.data.has
   * This method can be override
   */
  protected dataHas(key: TKey): boolean {
    return this.data.has(key);
  }

  /**
   * Use it instead of this.data.get
   * This method can be override
   */
  protected dataGet(key: TKey): TValue | undefined {
    return this.data.get(key);
  }

  /**
   * Use it instead of this.data.set
   * This method can be override
   */
  protected dataSet(key: TKey, value: TValue): void {
    this.data.set(key, value as TValue);
  }

  /**
   * Use it instead of this.data.delete
   * This method can be override
   */
  protected dataDelete(key: TKey): void {
    this.data.delete(key);
  }

  /**
   * Use it instead of this.data.clear
   * This method can be override
   */
  protected override clearData(): void {
    this.data.clear();
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
      return resource.isLoading(key);
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
