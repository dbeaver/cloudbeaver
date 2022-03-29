/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, computed, makeObservable, observable, runInAction } from 'mobx';

import { ISyncExecutor, SyncExecutor } from '@cloudbeaver/core-executor';
import { MetadataMap } from '@cloudbeaver/core-utils';

import { CachedResource, CachedResourceKey, ICachedResourceMetadata } from './CachedResource';
import type { CachedResourceIncludeArgs, CachedResourceValueIncludes } from './CachedResourceIncludes';
import { ResourceKey, resourceKeyList, ResourceKeyList, ResourceKeyUtils } from './ResourceKeyList';

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
  TRealKey extends ResourceKey<TKey>,
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

export abstract class CachedMapResource<
  TKey,
  TValue,
  TArguments = Record<string, any>
> extends CachedResource<
  Map<TKey, TValue>,
  ResourceKey<TKey>,
  TKey,
  string[] | undefined
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

  constructor(defaultIncludes?: CachedResourceIncludeArgs<TValue, TArguments>, defaultValue?: Map<TKey, TValue>) {
    //@ts-expect-error fix
    super(defaultValue || new Map(), defaultIncludes);
    this.onItemAdd = new SyncExecutor<ResourceKey<TKey>>(null);
    this.onItemDelete = new SyncExecutor<ResourceKey<TKey>>(null);

    this.metadata = new MetadataMap(() => observable({
      outdated: true,
      loading: false,
      exception: null,
      includes: observable([...this.defaultIncludes]),
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
      values: computed,
      keys: computed,
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

  //@ts-expect-error fix
  isIncludes(key: ResourceKey<TKey>, includes: CachedResourceIncludeArgs<TValue, TArguments>): boolean {
    key = this.transformParam(key);
    return ResourceKeyUtils.every(key, key => {
      const metadata = this.metadata.get(key);

      //@ts-expect-error fix
      return includes.every(include => metadata.includes.includes(include));
    });
  }

  getException(key: TKey): Error | null;
  getException(key: ResourceKeyList<TKey>): Array<Error | null>;
  getException(key: ResourceKey<TKey>): Array<Error | null> | Error | null;
  getException(key: ResourceKey<TKey>): Array<Error | null> | Error | null {
    key = this.transformParam(key);
    return ResourceKeyUtils.map(key, key => this.metadata.get(key).exception);
  }

  isOutdated(key: ResourceKey<TKey>): boolean {
    if (this.isAlias(key) && !this.isAliasLoaded(key)) {
      return true;
    }

    key = this.transformParam(key);
    return ResourceKeyUtils.some(key, key => {
      const metadata = this.metadata.get(key);

      return metadata.outdated;
    });
  }

  isDataLoading(key: ResourceKey<TKey>): boolean {
    key = this.transformParam(key);
    return ResourceKeyUtils.some(key, key => this.metadata.get(key).loading);
  }

  markDataLoading(key: ResourceKey<TKey>, includes?: string[]): void {
    key = this.transformParam(key);
    ResourceKeyUtils.forEach(key, key => {
      const metadata = this.metadata.get(key);
      metadata.loading = true;
    });
  }

  markDataLoaded(key: ResourceKey<TKey>, includes?: string[]): void {
    key = this.transformParam(key);

    if (includes) {
      this.commitIncludes(key, includes);
    }

    ResourceKeyUtils.forEach(key, key => {
      const metadata = this.metadata.get(key);
      metadata.loading = false;
    });
  }

  markDataError(exception: Error, key: ResourceKey<TKey>): void {
    if (this.isAlias(key) && !this.isAliasLoaded(key)) {
      this.loadedKeys.push(key);
    }
    key = this.transformParam(key);

    ResourceKeyUtils.forEach(key, key => {
      const metadata = this.metadata.get(key);
      metadata.exception = exception;
      metadata.outdated = false;
    });

    this.onDataError.execute({ param: key, exception });
  }

  markOutdated(): void;
  markOutdated(key: ResourceKey<TKey>): void;
  markOutdated(key?: ResourceKey<TKey>): void {
    if (
      (
        (key === undefined ? this.scheduler.executing : this.scheduler.isExecuting(key))
      ) && !this.outdateWaitList.some(param => this.includes(key!, param))) {
      this.outdateWaitList.push(key!);
      return;
    }

    this.markOutdatedSync(key!);
  }

  cleanError(): void;
  cleanError(key: ResourceKey<TKey>): void;
  cleanError(key?: ResourceKey<TKey>): void {
    if (key === undefined) {
      key = resourceKeyList(this.keys);
    } else {
      key = this.transformParam(key);
    }

    ResourceKeyUtils.forEach(key, key => {
      const metadata = this.metadata.get(key);
      metadata.exception = null;
    });
  }

  markUpdated(): void;
  markUpdated(key: ResourceKey<TKey>): void;
  markUpdated(key?: ResourceKey<TKey>): void {
    if (key === undefined) {
      // TODO: maybe should add all aliases to loadedKeys
      key = resourceKeyList(this.keys);
    } else {
      if (this.isAlias(key) && !this.isAliasLoaded(key)) {
        this.loadedKeys.push(key);
      }

      key = this.transformParam(key);
    }

    ResourceKeyUtils.forEach(key, key => {
      const metadata = this.metadata.get(key);
      metadata.outdated = false;
    });
  }

  //@ts-expect-error fix
  isLoaded(key: ResourceKey<TKey>, includes?: CachedResourceIncludeArgs<TValue, TArguments>): boolean {
    if (this.isAlias(key) && !this.isAliasLoaded(key)) {
      return false;
    }

    key = this.transformParam(key);
    return ResourceKeyUtils.every(key, key => {
      if (!this.has(key)) {
        return false;
      }

      if (includes) {
        const metadata = this.metadata.get(key);

        //@ts-expect-error fix
        if (includes.some(include => !metadata.includes.includes(include))) {
          return false;
        }
      }
      return true;
    });
  }

  get(key: TKey): TValue | undefined;
  get(key: ResourceKeyList<TKey>): Array<TValue | undefined>;
  get(key: ResourceKey<TKey>): Array<TValue | undefined> | TValue | undefined;
  get(key: ResourceKey<TKey>): Array<TValue | undefined> | TValue | undefined {
    key = this.transformParam(key);
    return ResourceKeyUtils.map(key, key => this.data.get(key));
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

  delete(key: TKey): void;
  delete(key: ResourceKeyList<TKey>): void;
  delete(key: ResourceKey<TKey>): void;
  delete(key: ResourceKey<TKey>): void {
    key = this.transformParam(key);

    this.onItemDelete.execute(key);
    ResourceKeyUtils.forEach(key, key => {
      this.dataDelete(key);
      this.metadata.delete(key);
    });
    this.markUpdated(key);
  }

  clear(): void {
    this.data.clear();
    this.metadata.clear();
  }

  async refresh<T extends CachedResourceIncludeArgs<TValue, TArguments> = []>(
    key: TKey,
    includes?: T
  ): Promise<CachedResourceValueIncludes<TValue, T>>;
  async refresh<T extends CachedResourceIncludeArgs<TValue, TArguments> = []>(
    key: ResourceKeyList<TKey>,
    includes?: T
  ): Promise<Array<CachedResourceValueIncludes<TValue, T>>>;
  async refresh<T extends CachedResourceIncludeArgs<TValue, TArguments> = []>(
    key: ResourceKey<TKey>,
    includes?: T
  ): Promise<Array<CachedResourceValueIncludes<TValue, T>> | CachedResourceValueIncludes<TValue, T>>;
  async refresh<T extends CachedResourceIncludeArgs<TValue, TArguments> = []>(
    key: ResourceKey<TKey>,
    includes?: T
  ): Promise<Array<CachedResourceValueIncludes<TValue, T>> | CachedResourceValueIncludes<TValue, T>> {
    //@ts-expect-error fix
    await this.loadData(key, true, includes);
    return this.get(key) as Array<CachedResourceValueIncludes<TValue, T>> | CachedResourceValueIncludes<TValue, T>;
  }

  async load<T extends CachedResourceIncludeArgs<TValue, TArguments> = []>(
    key: TKey,
    includes?: T
  ): Promise<CachedResourceValueIncludes<TValue, T>>;
  async load<T extends CachedResourceIncludeArgs<TValue, TArguments> = []>(
    key: ResourceKeyList<TKey>,
    includes?: T
  ): Promise<Array<CachedResourceValueIncludes<TValue, T>>>;
  async load<T extends CachedResourceIncludeArgs<TValue, TArguments> = []>(
    key: ResourceKey<TKey>,
    includes?: T
  ): Promise<Array<CachedResourceValueIncludes<TValue, T>> | CachedResourceValueIncludes<TValue, T>>;
  async load<T extends CachedResourceIncludeArgs<TValue, TArguments> = []>(
    key: ResourceKey<TKey>,
    includes?: T
  ): Promise<Array<CachedResourceValueIncludes<TValue, T>> | CachedResourceValueIncludes<TValue, T>> {
    //@ts-expect-error fix
    await this.loadData(key, false, includes);
    return this.get(key) as Array<CachedResourceValueIncludes<TValue, T>> | CachedResourceValueIncludes<TValue, T>;
  }

  has(key: TKey): boolean {
    if (this.isAlias(key) && !this.isAliasLoaded(key)) {
      return false;
    }

    key = this.transformParam(key) as TKey;
    return this.data.has(key);
  }

  includes(param: ResourceKey<TKey>, key: ResourceKey<TKey>): boolean {
    if (param === key) {
      return true;
    }

    return ResourceKeyUtils.includes(param, key);
  }

  getIncludes(key?: ResourceKey<TKey>): string[] {
    if (key === undefined) {
      return this.defaultIncludes;
    }
    key = this.transformParam(key);

    const metadata = this.metadata.get(ResourceKeyUtils.first(key));

    return metadata.includes;
  }

  getIncludesMap(key?: ResourceKey<TKey>, includes: string[] = this.defaultIncludes): Record<string, any> {
    const keyIncludes = this.getIncludes(key);
    return ['customIncludeBase', ...includes, ...keyIncludes].reduce<any>((map, key) => {
      map[key] = true;

      return map;
    }, {});
  }

  isKeyEqual(param: ResourceKey<TKey>, second: ResourceKey<TKey>): boolean {
    if (this.isAlias(param) || this.isAlias(second)) {
      return true;
    }

    return this.includes(param, second);
  }

  protected dataSet(key: TKey, value: TValue): void {
    this.data.set(key, value);
  }

  protected dataDelete(key: TKey): void {
    this.data.delete(key);
  }

  protected commitIncludes(key: ResourceKey<TKey>, includes: string[]): void {
    key = this.transformParam(key);
    ResourceKeyUtils.forEach(key, key => {
      const metadata = this.metadata.get(key);

      for (const include of includes) {
        if (!metadata.includes.includes(include)) {
          metadata.includes.push(include);
        }
      }
    });
  }

  protected markOutdatedSync(): void;
  protected markOutdatedSync(key: ResourceKey<TKey>): void;
  protected markOutdatedSync(key?: ResourceKey<TKey>): void {
    if (key === undefined) {
      key = ResourceKeyUtils.join(resourceKeyList(this.keys), ...this.loadedKeys.map(key => this.transformParam(key)));
      this.loadedKeys = [];
    } else {
      if (this.isAlias(key)) {
        const index = this.loadedKeys.findIndex(loadedKey => this.includes(key!, loadedKey));

        if (index >= 0) {
          this.loadedKeys.splice(index, 1);
        }
      }

      key = this.transformParam(key);
    }

    runInAction(() => ResourceKeyUtils.forEach(key!, key => {
      const metadata = this.metadata.get(key);
      metadata.outdated = true;
    }));

    this.onDataOutdated.execute(key);
  }
}
