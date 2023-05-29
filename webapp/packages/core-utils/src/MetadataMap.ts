/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, makeAutoObservable, observable } from 'mobx';

import { TempMap } from './TempMap';

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
    });
  }

  [Symbol.iterator](): IterableIterator<[TKey, TValue]> {
    return this.temp[Symbol.iterator]();
  }

  get [Symbol.toStringTag](): string {
    return 'MetadataMap';
  }

  sync(entities: Array<[TKey, TValue]>): void {
    this.temp.clear();
    this.data.clear();
    for (const [key, value] of entities) {
      this.data.set(key, value);
    }
    this.syncData = entities;
  }

  forEach(callbackfn: (value: TValue, key: TKey, map: Map<TKey, TValue>) => void, thisArg?: any): void {
    this.temp.forEach(callbackfn, thisArg);
  }

  entries(): IterableIterator<[TKey, TValue]> {
    return this.temp.entries();
  }

  keys(): IterableIterator<TKey> {
    return this.temp.keys();
  }

  values(): IterableIterator<TValue> {
    return this.temp.values();
  }

  has(key: TKey): boolean {
    return this.temp.has(key);
  }

  set(key: TKey, value: TValue): this {
    this.temp.set(key, value);
    return this;
  }

  get(key: TKey, defaultValue?: DefaultValueGetter<TKey, TValue>): TValue {
    if (!this.temp.has(key)) {
      const provider = defaultValue || this.defaultValueGetter;

      if (!provider) {
        throw new Error('MetadataMap: defaultValue should be provided if defaultValueGetter not set');
      }

      const value = provider(key, this);
      this.temp.set(key, observable(value as any));
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
