/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { Executor, IExecutor } from '@cloudbeaver/core-executor';

import { CachedResource } from './CachedResource';
import { ResourceKey, resourceKeyList, ResourceKeyList, ResourceKeyUtils } from './ResourceKeyList';

@injectable()
export abstract class CachedMapResource<TKey, TValue> extends CachedResource<
Map<TKey, TValue>,
ResourceKey<TKey>,
TKey
> {
  readonly onItemAdd: IExecutor<ResourceKey<TKey>>;
  readonly onItemDelete: IExecutor<ResourceKey<TKey>>;

  constructor(defaultValue?: Map<TKey, TValue>) {
    super(defaultValue || new Map());
    this.onItemAdd = new Executor(null, this.includes);
    this.onItemDelete = new Executor(null, this.includes);
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

  isLoaded(key: ResourceKey<TKey>): boolean {
    return ResourceKeyUtils.every(key, key => this.has(key));
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

  async refresh(key: TKey): Promise<TValue>;
  async refresh(key: ResourceKeyList<TKey>): Promise<TValue[]>;
  async refresh(key: ResourceKey<TKey>): Promise<TValue[]| TValue>;
  async refresh(key: ResourceKey<TKey>): Promise<TValue[]| TValue> {
    await this.loadData(key, true);
    return this.get(key) as TValue[]| TValue;
  }

  async load(key: TKey): Promise<TValue>;
  async load(key: ResourceKeyList<TKey>): Promise<TValue[]>;
  async load(key: ResourceKey<TKey>): Promise<TValue[]| TValue>;
  async load(key: ResourceKey<TKey>): Promise<TValue[]| TValue> {
    await this.loadData(key);
    return this.get(key) as TValue[]| TValue;
  }

  has(key: TKey): boolean {
    return this.data.has(key);
  }

  protected includes(param: ResourceKey<TKey>, key: ResourceKey<TKey>): boolean {
    return ResourceKeyUtils.includes(param, key);
  }
}
