/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';

export type DefaultValueGetter<TKey, TValue> = (key: TKey, metadata: MetadataMap<TKey, TValue>) => TValue

export class MetadataMap<TKey, TValue> {
  private data: Map<TKey, TValue>;
  private length: number;

  constructor(private defaultValueGetter: DefaultValueGetter<TKey, TValue>) {
    this.data = observable(new Map());
    this.length = 0;
  }

  [Symbol.iterator]() {
    return this.data[Symbol.iterator]();
  }

  entries() {
    return this.data.entries();
  }

  keys() {
    return this.data.keys();
  }

  values() {
    return this.data.values();
  }

  count() {
    return this.length;
  }

  has(key: TKey): boolean {
    return this.data.has(key);
  }

  set(key: TKey, value: TValue) {
    this.data.set(key, value);
  }

  get(key: TKey): TValue {
    if (this.data.has(key)) {
      return this.data.get(key)!;
    }
    const value = this.defaultValueGetter(key, this);
    this.data.set(key, value);
    this.length++;
    return this.data.get(key)!;
  }

  delete(key: TKey) {
    if (this.data.has(key)) {
      this.data.delete(key);
      this.length--;
    }
  }

  clear() {
    this.data.clear();
    this.length = 0;
  }
}
