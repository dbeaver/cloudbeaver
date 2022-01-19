/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { makeObservable, observable, untracked } from 'mobx';

export type MetadataValueGetter<TKey, TValue> = (key: TKey, metadata: MetadataMap<TKey, any>) => TValue;
export type DefaultValueGetter<TKey, TValue> = (key: TKey, metadata: MetadataMap<TKey, TValue>) => TValue;

export class MetadataMap<TKey, TValue> {
  private data: Map<TKey, TValue>;
  private length: number;

  private syncData: Array<[TKey, TValue]> | null;

  constructor(private defaultValueGetter?: DefaultValueGetter<TKey, TValue>) {
    this.data = observable(new Map());
    this.length = 0;
    this.syncData = null;

    makeObservable<this, 'data'>(this, {
      data: observable.ref,
    });
  }

  [Symbol.iterator]() {
    return this.data[Symbol.iterator]();
  }

  sync(entities: Array<[TKey, TValue]>): void {
    this.data = observable(new Map(entities));
    this.syncData = entities;
  }

  entries(): IterableIterator<[TKey, TValue]> {
    return this.data.entries();
  }

  keys(): IterableIterator<TKey> {
    return this.data.keys();
  }

  values(): IterableIterator<TValue> {
    return this.data.values();
  }

  count(): number {
    return this.length;
  }

  has(key: TKey): boolean {
    return this.data.has(key);
  }

  set(key: TKey, value: TValue): void {
    this.data.set(key, value);
    this.syncData?.push([key, this.data.get(key)!]);
  }

  get(key: TKey, defaultValue?: DefaultValueGetter<TKey, TValue>): TValue {
    if (this.data.has(key)) {
      return this.data.get(key)!;
    }

    const provider = defaultValue || this.defaultValueGetter;

    if (!provider) {
      throw new Error('MetadataMap: defaultValue should be provided if defaultValueGetter not set');
    }

    const value = provider(key, this);
    untracked(() => {
      this.set(key, value);
      this.length++;
    });
    return this.data.get(key)!;
  }

  delete(key: TKey): void {
    if (this.data.has(key)) {
      this.data.delete(key);

      const removeIndex = this.syncData?.findIndex(([k]) => k === key) || -1;
      if (removeIndex > -1) {
        this.syncData?.splice(removeIndex, 1);
      }
      this.length--;
    }
  }

  clear(): void {
    this.data.clear();
    this.length = 0;
    this.syncData?.splice(0, this.syncData.length);
  }
}
