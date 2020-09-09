/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Subject, Observable } from 'rxjs';

import { injectable } from '@cloudbeaver/core-di';

import { CachedResource } from './CachedResource';

export const RESOURCE_KEY_LIST = Symbol('@CachedMapResource/list');

export type ResourceKeyList<TKey> = {
  list: TKey[];
  [RESOURCE_KEY_LIST]: true;
}

export type ResourceKey<TKey> = TKey | ResourceKeyList<TKey>;

@injectable()
export abstract class CachedMapResource<TKey, TValue> extends CachedResource<
  Map<TKey, TValue>,
  ResourceKey<TKey>
>
{
  readonly onItemAdd: Observable<ResourceKey<TKey>>;
  readonly onItemDelete: Observable<ResourceKey<TKey>>;

  protected itemAddSubject: Subject<ResourceKey<TKey>>;
  protected itemDeleteSubject: Subject<ResourceKey<TKey>>;

  constructor(defaultValue?: Map<TKey, TValue>) {
    super(defaultValue || new Map());
    this.itemAddSubject = new Subject();
    this.onItemAdd = this.itemAddSubject.asObservable();
    this.itemDeleteSubject = new Subject();
    this.onItemDelete = this.itemDeleteSubject.asObservable();
  }

  isOutdated(key: ResourceKey<TKey>): boolean {
    if (isResourceKeyList(key)) {
      return key.list.some(key => this.outdated.has(key));
    }
    return this.outdated.has(key);
  }

  markOutdated(): void
  markOutdated(key: ResourceKey<TKey>): void
  markOutdated(key?: ResourceKey<TKey>): void {
    if (!key) {
      key = resourceKeyList(Array.from(this.data.keys()));
    }

    if (isResourceKeyList(key)) {
      for (const itemKey of key.list) {
        this.outdated.add(itemKey);
      }
    } else {
      this.outdated.add(key);
    }
    this.outdatedSubject.next(key);
  }

  markUpdated(): void
  markUpdated(key: ResourceKey<TKey>): void
  markUpdated(key?: ResourceKey<TKey>): void {
    if (!key) {
      key = resourceKeyList(Array.from(this.data.keys()));
    }

    if (isResourceKeyList(key)) {
      for (const itemKey of key.list) {
        this.outdated.delete(itemKey);
      }
    } else {
      this.outdated.delete(key);
    }
  }

  isLoaded(key: ResourceKey<TKey>): boolean {
    if (isResourceKeyList(key)) {
      return key.list.every(key => this.has(key));
    }
    return this.has(key);
  }

  isDataLoading(key: ResourceKey<TKey>): boolean {
    if (isResourceKeyList(key)) {
      return key.list.some(
        key => (isResourceKeyList(this.activePromiseParam)
          ? this.activePromiseParam.list.includes(key)
          : key === this.activePromiseParam)
      );
    }
    return this.activePromiseParam === key;
  }

  get(key: TKey): TValue | undefined;
  get(key: ResourceKeyList<TKey>): Array<TValue | undefined>;
  get(key: ResourceKey<TKey>): Array<TValue | undefined>| TValue | undefined;
  get(key: ResourceKey<TKey>): Array<TValue | undefined>| TValue | undefined {
    if (isResourceKeyList(key)) {
      return key.list.map(key => this.data.get(key));
    }
    return this.data.get(key);
  }

  set(key: TKey, value: TValue): void;
  set(key: ResourceKeyList<TKey>, value: TValue[]): void;
  set(key: ResourceKey<TKey>, value: TValue | TValue[]): void {
    if (isResourceKeyList(key)) {
      for (let i = 0; i < key.list.length; i++) {
        this.data.set(key.list[i], (value as TValue[])[i]);
      }
    } else {
      this.data.set(key, value as TValue);
    }
    this.markUpdated(key);
    this.itemAddSubject.next(key);
  }

  delete(key: TKey): void;
  delete(key: ResourceKeyList<TKey>): void;
  delete(key: ResourceKey<TKey>): void;
  delete(key: ResourceKey<TKey>) {
    if (isResourceKeyList(key)) {
      for (let i = 0; i < key.list.length; i++) {
        this.data.delete(key.list[i]);
      }
    } else {
      this.data.delete(key);
    }
    this.markUpdated(key);
    this.itemDeleteSubject.next(key);
  }

  async refresh(key: TKey): Promise<TValue>;
  async refresh(key: ResourceKeyList<TKey>): Promise<Array<TValue>>;
  async refresh(key: ResourceKey<TKey>): Promise<Array<TValue>| TValue>;
  async refresh(key: ResourceKey<TKey>): Promise<Array<TValue>| TValue> {
    this.markOutdated(key);
    await this.loadData(key);
    return this.get(key) as Array<TValue>| TValue;
  }

  async load(key: TKey): Promise<TValue>;
  async load(key: ResourceKeyList<TKey>): Promise<Array<TValue>>;
  async load(key: ResourceKey<TKey>): Promise<Array<TValue>| TValue>;
  async load(key: ResourceKey<TKey>): Promise<Array<TValue>| TValue> {
    await this.loadData(key);
    return this.get(key) as Array<TValue>| TValue;
  }

  has(key: TKey): boolean {
    return this.data.has(key);
  }
}

export function isResourceKeyList<T>(data: any): data is ResourceKeyList<T> {
  return data && typeof data === 'object' && RESOURCE_KEY_LIST in data;
}

export function resourceKeyList<T>(list: T[]): ResourceKeyList<T> {
  return { [RESOURCE_KEY_LIST]: true, list };
}
