/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, computed, entries, keys, makeObservable, values } from 'mobx';

import { type ISyncExecutor, SyncExecutor } from '@cloudbeaver/core-executor';
import { type ILoadableState, isArraysEqual, isContainsException } from '@cloudbeaver/core-utils';

import { CachedResource } from './CachedResource.js';
import type { CachedResourceIncludeArgs, CachedResourceValueIncludes } from './CachedResourceIncludes.js';
import type { ICachedResourceMetadata } from './ICachedResourceMetadata.js';
import type { CachedResourceKey } from './IResource.js';
import type { ResourceKey, ResourceKeySimple } from './ResourceKey.js';
import type { ResourceKeyAlias } from './ResourceKeyAlias.js';
import { isResourceKeyList, resourceKeyList, ResourceKeyList } from './ResourceKeyList.js';
import { ResourceKeyListAlias, resourceKeyListAlias } from './ResourceKeyListAlias.js';
import { ResourceKeyUtils } from './ResourceKeyUtils.js';

export type CachedMapResourceKey<TResource> = CachedResourceKey<TResource>;
export type CachedMapResourceValue<TResource> = TResource extends CachedResource<Map<any, infer T>, any, any, any, any> ? T : never;
export type CachedMapResourceArguments<TResource> = TResource extends CachedMapResource<any, any, infer T, any> ? T : never;

export type CachedMapResourceListGetter<TValue, TIncludes> = Array<CachedMapResourceGetter<TValue, TIncludes>>;

export type CachedMapResourceGetter<TValue, TIncludes> = CachedResourceValueIncludes<TValue, TIncludes> | undefined;

export type CachedMapResourceLoader<TRealKey, TKey, TValue, TIncludes> =
  TRealKey extends ResourceKeyList<TKey> ? Array<CachedResourceValueIncludes<TValue, TIncludes>> : CachedResourceValueIncludes<TValue, TIncludes>;

export const CachedMapAllKey = resourceKeyListAlias('@cached-map-resource/all');

/**
 * CachedMapResource is a resource that stores data in a Map.
 */
export abstract class CachedMapResource<
  TKey,
  TValue,
  TContext extends Record<string, any> = Record<string, never>,
  TMetadata extends ICachedResourceMetadata = ICachedResourceMetadata,
> extends CachedResource<Map<TKey, TValue>, TValue, TKey, CachedResourceIncludeArgs<TValue, TContext>, TMetadata> {
  readonly onItemUpdate: ISyncExecutor<ResourceKeySimple<TKey>>;
  readonly onItemDelete: ISyncExecutor<ResourceKeySimple<TKey>>;

  get entries(): [TKey, TValue][] {
    return entries(this.data) as [TKey, TValue][];
  }

  get values(): TValue[] {
    return values(this.data) as TValue[];
  }

  get keys(): TKey[] {
    return keys(this.data) as TKey[];
  }

  constructor(defaultValue?: () => Map<TKey, TValue>, defaultIncludes?: CachedResourceIncludeArgs<TValue, TContext>) {
    super(CachedMapAllKey, defaultValue || (() => new Map()), defaultIncludes);
    this.onItemUpdate = new SyncExecutor<ResourceKeySimple<TKey>>(null);
    this.onItemDelete = new SyncExecutor<ResourceKeySimple<TKey>>(null);

    this.aliases.add(CachedMapAllKey, () => resourceKeyList(this.keys));

    makeObservable<this, 'dataSet' | 'dataDelete'>(this, {
      set: action,
      delete: action,
      replace: action,
      dataSet: action,
      dataDelete: action,
      entries: computed<[TKey, TValue][]>({
        equals: (a, b) => isArraysEqual(a, b, isArraysEqual),
      }),
      values: computed<TValue[]>({
        equals: isArraysEqual,
      }),
      keys: computed<TKey[]>({
        equals: isArraysEqual,
      }),
    });
  }

  deleteInResource<T = TKey>(resource: CachedMapResource<T, any, any>, map?: (key: ResourceKey<TKey>) => ResourceKey<T>): this {
    this.onItemDelete.addHandler(param => {
      try {
        this.logger.group('outdate - ' + resource.logger.getName());

        if (map) {
          param = map(param) as any as TKey;
        }

        resource.delete(param as any as T);
      } finally {
        this.logger.groupEnd();
      }
    });

    return this;
  }

  has(key: ResourceKey<TKey>): boolean {
    if (this.aliases.isAlias(key) && (!this.metadata.has(key) || this.isLoaded(key))) {
      return false;
    }

    key = this.aliases.transformToKey(key);
    return ResourceKeyUtils.every(key, key => this.dataHas(this.getKeyRef(key)));
  }

  get(key: TKey | ResourceKeyAlias<TKey, any>): TValue | undefined;
  get(key: ResourceKeyList<TKey> | ResourceKeyListAlias<TKey, any>): Array<TValue | undefined>;
  get(key: ResourceKey<TKey>): Array<TValue | undefined> | TValue | undefined;
  get(key: ResourceKey<TKey>): Array<TValue | undefined> | TValue | undefined {
    key = this.aliases.transformToKey(key);
    return ResourceKeyUtils.map(key, key => this.dataGet(this.getKeyRef(key)));
  }

  set(key: TKey | ResourceKeyAlias<TKey, any>, value: TValue): void;
  set(key: ResourceKeyList<TKey> | ResourceKeyListAlias<TKey, any>, value: TValue[]): void;
  set(key: ResourceKey<TKey>, value: TValue | TValue[]): void;
  set(originalKey: ResourceKey<TKey>, value: TValue | TValue[]): void {
    const key = this.aliases.transformToKey(originalKey);

    if (isResourceKeyList(key)) {
      if (key.length === 0) {
        return;
      }

      for (let i = 0; i < key.length; i++) {
        this.dataSet(this.getKeyRef(key[i]!), (value as TValue[])[i]!);
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
    const key = this.aliases.transformToKey(originalKey);

    if (isResourceKeyList(key) && key.length === 0) {
      return;
    }

    this.onItemDelete.execute(key);
    ResourceKeyUtils.forEach(key, key => {
      this.dataDelete(this.getKeyRef(key));
    });
    this.metadata.delete(originalKey);

    // rewrites pending outdate
    this.markUpdated(key);
  }

  override async refresh<T extends CachedResourceIncludeArgs<TValue, TContext> = []>(
    key: TKey | ResourceKeyAlias<TKey, any>,
    includes?: T,
  ): Promise<CachedResourceValueIncludes<TValue, T>>;
  override async refresh<T extends CachedResourceIncludeArgs<TValue, TContext> = []>(
    key?: ResourceKeyList<TKey> | ResourceKeyListAlias<TKey, any> | void,
    includes?: T,
  ): Promise<Array<CachedResourceValueIncludes<TValue, T>>>;
  override async refresh<T extends CachedResourceIncludeArgs<TValue, TContext> = []>(
    key: ResourceKey<TKey>,
    includes?: T,
  ): Promise<Array<CachedResourceValueIncludes<TValue, T>> | CachedResourceValueIncludes<TValue, T>>;
  override async refresh<T extends CachedResourceIncludeArgs<TValue, TContext> = []>(
    key?: ResourceKey<TKey> | void,
    includes?: T,
  ): Promise<Array<CachedResourceValueIncludes<TValue, T>> | CachedResourceValueIncludes<TValue, T>> {
    if (key === undefined) {
      key = CachedMapAllKey;
    }
    await this.loadData(key, true, includes);
    return this.get(key) as Array<CachedResourceValueIncludes<TValue, T>> | CachedResourceValueIncludes<TValue, T>;
  }

  override async load<T extends CachedResourceIncludeArgs<TValue, TContext> = []>(
    key: TKey | ResourceKeyAlias<TKey, any>,
    includes?: T,
  ): Promise<CachedResourceValueIncludes<TValue, T>>;
  override async load<T extends CachedResourceIncludeArgs<TValue, TContext> = []>(
    key?: ResourceKeyList<TKey> | ResourceKeyListAlias<TKey, any> | void,
    includes?: T,
  ): Promise<Array<CachedResourceValueIncludes<TValue, T>>>;
  override async load<T extends CachedResourceIncludeArgs<TValue, TContext> = []>(
    key: ResourceKey<TKey>,
    includes?: T,
  ): Promise<Array<CachedResourceValueIncludes<TValue, T>> | CachedResourceValueIncludes<TValue, T>>;
  override async load<T extends CachedResourceIncludeArgs<TValue, TContext> = []>(
    key?: ResourceKey<TKey> | void,
    includes?: T,
  ): Promise<Array<CachedResourceValueIncludes<TValue, T>> | CachedResourceValueIncludes<TValue, T>> {
    if (key === undefined) {
      key = CachedMapAllKey;
    }
    await this.loadData(key, false, includes);
    return this.get(key) as Array<CachedResourceValueIncludes<TValue, T>> | CachedResourceValueIncludes<TValue, T>;
  }

  override getKeyRef(key: TKey): TKey {
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
  protected override resetDataToDefault(): void {
    this.data.clear();
  }
}

export function getCachedMapResourceLoaderState<TKey, TValue, TContext extends Record<string, any> = Record<string, never>>(
  resource: CachedMapResource<TKey, TValue, TContext>,
  getKey: () => ResourceKey<TKey> | null,
  getIncludes?: () => CachedResourceIncludeArgs<TValue, TContext> | undefined,
  lazy?: boolean,
): ILoadableState {
  return {
    lazy,
    get exception() {
      const key = getKey();

      if (key === null) {
        return null;
      }

      return resource.getException(key);
    },
    isLoading() {
      const key = getKey();

      if (key === null) {
        return false;
      }

      return resource.isLoading(key);
    },
    isLoaded() {
      const key = getKey();

      if (key === null) {
        return true;
      }

      return resource.isLoaded(key, getIncludes?.());
    },
    isError() {
      return isContainsException(this.exception);
    },
    isOutdated() {
      const key = getKey();

      if (key === null) {
        return false;
      }

      return resource.isOutdated(key, getIncludes?.());
    },
    async load() {
      const key = getKey();

      if (key === null) {
        return;
      }

      await resource.load(key, getIncludes?.());
    },
    async reload() {
      const key = getKey();

      if (key === null) {
        return;
      }

      await resource.refresh(key, getIncludes?.());
    },
  };
}
