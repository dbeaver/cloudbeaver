/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed, makeObservable } from 'mobx';

import { Executor, IExecutor } from '@cloudbeaver/core-executor';
import { MetadataMap } from '@cloudbeaver/core-utils';

import { CachedResource, ICachedResourceMetadata } from './CachedResource';
import { ResourceKey, resourceKeyList, ResourceKeyList, ResourceKeyUtils } from './ResourceKeyList';

export type CachedMapValueIncludes<TValue, TKeys extends Array<keyof TValue>> = TValue
& (TKeys extends Array<infer T> ?
  {
    [P in Extract<T, keyof TValue>]-?: Required<TValue>[P] extends undefined ? TValue[P] : NonNullable<TValue[P]>;
  }
  // eslint-disable-next-line @typescript-eslint/ban-types
  : { });

export type CachedMapResourceGetter<
  TRealKey extends ResourceKey<TKey>,
  TKey,
  TValue,
  TIncludes extends Array<keyof TValue>
> = TRealKey extends ResourceKeyList<TKey>
  ? Array<CachedMapValueIncludes<TValue, TIncludes> | undefined>
  : CachedMapValueIncludes<TValue, TIncludes> | undefined;

export interface ICachedMapResourceMetadata<TValue> extends ICachedResourceMetadata {
  includes: Array<keyof TValue>;
  loadedIncludes: Array<keyof TValue>;
}

export abstract class CachedMapResource<
  TKey,
  TValue
> extends CachedResource<
  Map<TKey, TValue>,
  ResourceKey<TKey>,
  TKey
  > {
  readonly onItemAdd: IExecutor<ResourceKey<TKey>>;
  readonly onItemDelete: IExecutor<ResourceKey<TKey>>;
  protected metadata: MetadataMap<TKey, ICachedMapResourceMetadata<TValue>>;
  private defaultIncludes: Array<keyof TValue>;

  get values(): TValue[] {
    return Array.from(this.data.values());
  }

  get keys(): TKey[] {
    return Array.from(this.data.keys());
  }

  constructor(defaultIncludes?: Array<keyof TValue>, defaultValue?: Map<TKey, TValue>) {
    super(defaultValue || new Map());
    this.onItemAdd = new Executor(null, this.includes);
    this.onItemDelete = new Executor(null, this.includes);
    this.defaultIncludes = defaultIncludes || [];

    this.metadata = new MetadataMap(() => ({
      outdated: true,
      loading: false,
      includes: this.defaultIncludes,
      loadedIncludes: this.defaultIncludes,
    }));

    makeObservable(this, {
      values: computed,
      keys: computed,
    });
  }

  isIncludes(key: ResourceKey<TKey>, includes: Array<keyof TValue>): boolean {
    return ResourceKeyUtils.every(key, key => {
      const metadata = this.metadata.get(key);

      return includes.every(include => metadata.includes.includes(include));
    });
  }

  isOutdated(key: ResourceKey<TKey>): boolean {
    return ResourceKeyUtils.some(key, key => this.metadata.get(key).outdated);
  }

  isDataLoading(key: ResourceKey<TKey>): boolean {
    return ResourceKeyUtils.some(key, key => this.metadata.get(key).loading);
  }

  markDataLoading(key: ResourceKey<TKey>): void {
    ResourceKeyUtils.forEach(key, key => {
      const metadata = this.metadata.get(key);
      metadata.loading = true;
    });
  }

  markDataLoaded(key: ResourceKey<TKey>): void {
    this.commitIncludes(key);
    ResourceKeyUtils.forEach(key, key => {
      const metadata = this.metadata.get(key);
      metadata.loading = false;
    });
  }

  markOutdated(): void
  markOutdated(key: ResourceKey<TKey>): void
  markOutdated(key?: ResourceKey<TKey>): void {
    if (!key) {
      key = resourceKeyList(Array.from(this.data.keys()));
    }

    ResourceKeyUtils.forEach(key, key => {
      const metadata = this.metadata.get(key);
      metadata.outdated = true;
    });
    this.onDataOutdated.execute(key);
  }

  markUpdated(): void
  markUpdated(key: ResourceKey<TKey>): void
  markUpdated(key?: ResourceKey<TKey>): void {
    if (!key) {
      key = resourceKeyList(Array.from(this.data.keys()));
    }

    ResourceKeyUtils.forEach(key, key => {
      const metadata = this.metadata.get(key);
      metadata.outdated = false;
    });
  }

  isLoaded(key: ResourceKey<TKey>, includes?: Array<keyof TValue>): boolean {
    return ResourceKeyUtils.every(key, key => {
      if (!this.has(key)) {
        return false;
      }

      const metadata = this.metadata.get(key);

      if (!includes) {
        includes = metadata.includes;
      }

      if (includes.length > metadata.loadedIncludes.length) {
        return false;
      }

      if (includes.some(include => !metadata.loadedIncludes.includes(include))) {
        return false;
      }
      return true;
    });
  }

  get(key: TKey): TValue | undefined;
  get(key: ResourceKeyList<TKey>): Array<TValue | undefined>;
  get(key: ResourceKey<TKey>): Array<TValue | undefined>| TValue | undefined;
  get(key: ResourceKey<TKey>): Array<TValue | undefined>| TValue | undefined {
    return ResourceKeyUtils.map(key, key => this.data.get(key));
  }

  set(key: TKey, value: TValue): void;
  set(key: ResourceKeyList<TKey>, value: TValue[]): void;
  set(key: ResourceKey<TKey>, value: TValue | TValue[]): void {
    ResourceKeyUtils.forEach(key, (key, i) => {
      if (i === -1) {
        this.data.set(key, value as TValue);
      } else {
        this.data.set(key, (value as TValue[])[i]);
      }
    });
    this.markUpdated(key);
    this.onItemAdd.execute(key);
  }

  delete(key: TKey): void;
  delete(key: ResourceKeyList<TKey>): void;
  delete(key: ResourceKey<TKey>): void;
  delete(key: ResourceKey<TKey>): void {
    ResourceKeyUtils.forEach(key, key => this.data.delete(key));
    this.markUpdated(key);
    this.onItemDelete.execute(key);
  }

  async refresh<T extends Array<keyof TValue> = []>(
    key: TKey,
    includes?: T
  ): Promise<CachedMapValueIncludes<TValue, T>>;
  async refresh<T extends Array<keyof TValue> = []>(
    key: ResourceKeyList<TKey>,
    includes?: T
  ): Promise<Array<CachedMapValueIncludes<TValue, T>>>;
  async refresh<T extends Array<keyof TValue> = []>(
    key: ResourceKey<TKey>,
    includes?: T
  ): Promise<Array<CachedMapValueIncludes<TValue, T>> | CachedMapValueIncludes<TValue, T>>;
  async refresh<T extends Array<keyof TValue> = []>(
    key: ResourceKey<TKey>,
    includes?: T
  ): Promise<Array<CachedMapValueIncludes<TValue, T>> | CachedMapValueIncludes<TValue, T>> {
    this.setIncludes(key, includes || []);
    await this.loadData(key, true);
    return this.get(key) as Array<CachedMapValueIncludes<TValue, T>> | CachedMapValueIncludes<TValue, T>;
  }

  async load<T extends Array<keyof TValue> = []>(
    key: TKey,
    includes?: T
  ): Promise<CachedMapValueIncludes<TValue, T>>;
  async load<T extends Array<keyof TValue> = []>(
    key: ResourceKeyList<TKey>,
    includes?: T
  ): Promise<Array<CachedMapValueIncludes<TValue, T>>>;
  async load<T extends Array<keyof TValue> = []>(
    key: ResourceKey<TKey>,
    includes?: T
  ): Promise<Array<CachedMapValueIncludes<TValue, T>> | CachedMapValueIncludes<TValue, T>>;
  async load<T extends Array<keyof TValue> = []>(
    key: ResourceKey<TKey>,
    includes?: T
  ): Promise<Array<CachedMapValueIncludes<TValue, T>> | CachedMapValueIncludes<TValue, T>> {
    this.setIncludes(key, includes || []);
    await this.loadData(key);
    return this.get(key) as Array<CachedMapValueIncludes<TValue, T>> | CachedMapValueIncludes<TValue, T>;
  }

  has(key: TKey): boolean {
    return this.data.has(key);
  }

  includes(param: ResourceKey<TKey>, key: ResourceKey<TKey>): boolean {
    return ResourceKeyUtils.includes(param, key);
  }

  getIncludes(key?: ResourceKey<TKey>): Record<string, any> {
    if (!key) {
      return ['base', ...this.defaultIncludes].reduce<any>((map, key) => {
        map[this.getIncludeName(key as string)] = true;

        return map;
      }, {});
    }

    const metadata = this.metadata.get(ResourceKeyUtils.first(key));

    return ['base', ...metadata.includes].reduce<any>((map, key) => {
      map[this.getIncludeName(key as string)] = true;

      return map;
    }, {});
  }

  private setIncludes(key: ResourceKey<TKey>, includes: Array<keyof TValue>) {
    if (includes.length === 0) {
      return;
    }

    ResourceKeyUtils.forEach(key, key => {
      const metadata = this.metadata.get(key);

      const newIncludes = [...metadata.loadedIncludes];

      for (const include of includes) {
        if (!metadata.loadedIncludes.includes(include)) {
          newIncludes.push(include);
        }
      }

      if (metadata.loadedIncludes.length < newIncludes.length) {
        metadata.includes = newIncludes;
      }
    });
  }

  private commitIncludes(key: ResourceKey<TKey>) {
    ResourceKeyUtils.forEach(key, key => {
      const metadata = this.metadata.get(key);
      metadata.loadedIncludes = metadata.includes;
    });
  }

  private getIncludeName(key: string) {
    return 'include' + key.charAt(0).toUpperCase() + key.slice(1);
  }
}
