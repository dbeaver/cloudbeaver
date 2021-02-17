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

export type IncludesProps<TValue, TArgs> = {
  [P in keyof TArgs as P extends CachedMapIncludeKeyTemplated<TValue> ? P : never]?: boolean
};

export type CachedMapIncludeKeyTemplated<TValue> = `include${Capitalize<string & keyof TValue>}` | `customInclude${Capitalize<string>}`;
export type CachedMapIncludeList<TValue> = Array<CachedMapIncludeKeyTemplated<TValue>>;
export type CachedMapIncludeToKey<TKey> = TKey extends Array<`include${infer T}` | `customInclude${Capitalize<string>}`> ? Uncapitalize<T> : unknown;
export type CachedMapIncludeArgs<TValue, TArguments> = Array<keyof IncludesProps<TValue, TArguments>>;

export type CachedMapValueIncludes<TValue, TKeys> = TValue
& ({
  [P in Extract<CachedMapIncludeToKey<TKeys>, keyof TValue>]-?: Required<TValue>[P] extends undefined
    ? TValue[P]
    : NonNullable<TValue[P]>;
});

export type CachedMapResourceGetter<
  TRealKey extends ResourceKey<TKey>,
  TKey,
  TValue,
  TIncludes
> = TRealKey extends ResourceKeyList<TKey>
  ? Array<CachedMapValueIncludes<TValue, TIncludes> | undefined>
  : CachedMapValueIncludes<TValue, TIncludes> | undefined;

export interface ICachedMapResourceMetadata extends ICachedResourceMetadata {
  includes: string[];
}

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
  readonly onItemAdd: IExecutor<ResourceKey<TKey>>;
  readonly onItemDelete: IExecutor<ResourceKey<TKey>>;
  protected metadata: MetadataMap<TKey, ICachedMapResourceMetadata>;
  protected defaultIncludes: string[];

  get values(): TValue[] {
    return Array.from(this.data.values());
  }

  get keys(): TKey[] {
    return Array.from(this.data.keys());
  }

  constructor(defaultIncludes?: CachedMapIncludeArgs<TValue, TArguments>, defaultValue?: Map<TKey, TValue>) {
    super(defaultValue || new Map());
    this.onItemAdd = new Executor(null, this.includes);
    this.onItemDelete = new Executor(null, this.includes);
    this.defaultIncludes = defaultIncludes || [];

    this.metadata = new MetadataMap(() => ({
      outdated: true,
      loading: false,
      includes: [...this.defaultIncludes],
    }));

    makeObservable(this, {
      values: computed,
      keys: computed,
    });
  }

  isIncludes(key: ResourceKey<TKey>, includes: CachedMapIncludeArgs<TValue, TArguments>): boolean {
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

  markDataLoading(key: ResourceKey<TKey>, includes?: string[]): void {
    ResourceKeyUtils.forEach(key, key => {
      const metadata = this.metadata.get(key);
      metadata.loading = true;
    });
  }

  markDataLoaded(key: ResourceKey<TKey>, includes?: string[]): void {
    if (includes) {
      this.commitIncludes(key, includes);
    }

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

  isLoaded(key: ResourceKey<TKey>, includes?: CachedMapIncludeArgs<TValue, TArguments>): boolean {
    return ResourceKeyUtils.every(key, key => {
      if (!this.has(key)) {
        return false;
      }

      if (includes) {
        const metadata = this.metadata.get(key);

        if (includes.some(include => !metadata.includes.includes(include))) {
          return false;
        }
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

  async refresh<T extends CachedMapIncludeArgs<TValue, TArguments> = []>(
    key: TKey,
    includes?: T
  ): Promise<CachedMapValueIncludes<TValue, T>>;
  async refresh<T extends CachedMapIncludeArgs<TValue, TArguments> = []>(
    key: ResourceKeyList<TKey>,
    includes?: T
  ): Promise<Array<CachedMapValueIncludes<TValue, T>>>;
  async refresh<T extends CachedMapIncludeArgs<TValue, TArguments> = []>(
    key: ResourceKey<TKey>,
    includes?: T
  ): Promise<Array<CachedMapValueIncludes<TValue, T>> | CachedMapValueIncludes<TValue, T>>;
  async refresh<T extends CachedMapIncludeArgs<TValue, TArguments> = []>(
    key: ResourceKey<TKey>,
    includes?: T
  ): Promise<Array<CachedMapValueIncludes<TValue, T>> | CachedMapValueIncludes<TValue, T>> {
    await this.loadData(key, true, includes);
    return this.get(key) as Array<CachedMapValueIncludes<TValue, T>> | CachedMapValueIncludes<TValue, T>;
  }

  async load<T extends CachedMapIncludeArgs<TValue, TArguments> = []>(
    key: TKey,
    includes?: T
  ): Promise<CachedMapValueIncludes<TValue, T>>;
  async load<T extends CachedMapIncludeArgs<TValue, TArguments> = []>(
    key: ResourceKeyList<TKey>,
    includes?: T
  ): Promise<Array<CachedMapValueIncludes<TValue, T>>>;
  async load<T extends CachedMapIncludeArgs<TValue, TArguments> = []>(
    key: ResourceKey<TKey>,
    includes?: T
  ): Promise<Array<CachedMapValueIncludes<TValue, T>> | CachedMapValueIncludes<TValue, T>>;
  async load<T extends CachedMapIncludeArgs<TValue, TArguments> = []>(
    key: ResourceKey<TKey>,
    includes?: T
  ): Promise<Array<CachedMapValueIncludes<TValue, T>> | CachedMapValueIncludes<TValue, T>> {
    await this.loadData(key, false, includes);
    return this.get(key) as Array<CachedMapValueIncludes<TValue, T>> | CachedMapValueIncludes<TValue, T>;
  }

  has(key: TKey): boolean {
    return this.data.has(key);
  }

  includes(param: ResourceKey<TKey>, key: ResourceKey<TKey>): boolean {
    return ResourceKeyUtils.includes(param, key);
  }

  getIncludes(key?: ResourceKey<TKey>): string[] {
    if (!key) {
      return this.defaultIncludes;
    }

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

  protected resetIncludes(): void {
    const keys = resourceKeyList(this.keys);
    ResourceKeyUtils.forEach(keys, key => {
      const metadata = this.metadata.get(key);

      metadata.includes = [...this.defaultIncludes];
    });
  }

  protected commitIncludes(key: ResourceKey<TKey>, includes: string[]): void {
    ResourceKeyUtils.forEach(key, key => {
      const metadata = this.metadata.get(key);

      for (const include of includes) {
        if (!metadata.includes.includes(include)) {
          metadata.includes.push(include);
        }
      }
    });
  }
}
