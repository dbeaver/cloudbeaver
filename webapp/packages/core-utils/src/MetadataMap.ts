/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, makeAutoObservable, observable } from 'mobx';

import type { schema } from './schema.js';
import { TempMap } from './TempMap.js';

export type MetadataValueGetter<TKey, TValue> = (key: TKey, metadata: MetadataMap<TKey, any>) => TValue;
export type DefaultValueGetter<TKey, TValue> = (key: TKey, metadata: MetadataMap<TKey, TValue>) => TValue;

export class MetadataMap<TKey, TValue> implements Map<TKey, TValue> {
  get size(): number {
    return this.temp.size;
  }
  private syncData: Array<[TKey, TValue]> | null;
  private readonly temp: TempMap<TKey, TValue>;
  private readonly data: Map<TKey, TValue>;

  constructor(private readonly defaultValueGetter?: DefaultValueGetter<TKey, TValue>) {
    this.syncData = null;
    this.data = observable(new Map());
    this.temp = new TempMap<TKey, TValue>(this.data, () => {
      this.syncData?.splice(0, this.syncData.length, ...this.data.entries());
    });

    makeAutoObservable(this, {
      sync: action,
      unSync: action,
    });
  }

  [Symbol.iterator](): ArrayIterator<[TKey, TValue]> {
    return this.temp[Symbol.iterator]();
  }

  get [Symbol.toStringTag](): string {
    return 'MetadataMap';
  }

  sync(entities: Array<[TKey, TValue]>): void {
    if (this.syncData === entities) {
      return;
    }

    this.temp.clear();
    this.data.clear();
    for (const [key, value] of entities) {
      this.data.set(key, value);
    }
    this.syncData = entities;
  }

  unSync(): void {
    this.syncData = null;
  }

  forEach(callbackfn: (value: TValue, key: TKey, map: Map<TKey, TValue>) => void, thisArg?: any): void {
    this.temp.forEach(callbackfn, thisArg);
  }

  entries(): ArrayIterator<[TKey, TValue]> {
    return this.temp.entries();
  }

  keys(): ArrayIterator<TKey> {
    return this.temp.keys();
  }

  values(): ArrayIterator<TValue> {
    return this.temp.values();
  }

  has(key: TKey): boolean {
    return this.temp.has(key);
  }

  set(key: TKey, value: TValue): this {
    this.temp.set(key, value);
    return this;
  }

  // TODO replace zod schema with just validation callback returning true/false.
  // In case we use something else than zod
  get(key: TKey, defaultValue?: DefaultValueGetter<TKey, TValue>, schema?: schema.AnyZodObject): TValue {
    const value = this.temp.get(key);
    let invalidate = !this.temp.has(key);

    if (!invalidate && schema) {
      const parsed = schema.safeParse(value);

      if (!parsed.success) {
        invalidate = true;
      }
    }

    if (invalidate) {
      const provider = defaultValue || this.defaultValueGetter;

      if (!provider) {
        throw new Error('MetadataMap: defaultValue should be provided if defaultValueGetter not set');
      }

      const value = provider(key, this);
      const isNotPrimitiveValue = typeof value === 'object' && value !== null;

      this.temp.set(key, isNotPrimitiveValue ? observable(value) : value);
    }

    return this.temp.get(key)!;
  }

  delete(key: TKey): boolean {
    return this.temp.delete(key);
  }

  clear(): void {
    this.data.clear();
    this.temp.clear();
    this.syncData?.splice(0, this.syncData.length);
  }
}
