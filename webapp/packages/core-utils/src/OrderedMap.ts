/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, computed, observable } from 'mobx';

export class OrderedMap<K, V> {
  private indexes = observable.array<K>([], { deep: false });
  @observable.shallow private map: Map<K, V> = new Map<K, V>();

  @computed get keys(): K[] {
    return this.indexes;
  }

  @computed get values(): V[] {
    return this.indexes.map(i => this.map.get(i)!);
  }

  constructor(private toKey?: (val: V) => K) {
  }

  get(key: K): V | undefined {
    return this.map.get(key);
  }

  has(key: K): boolean {
    return this.map.has(key);
  }

  @action
  add(key: K, value: V): void {
    if (this.map.has(key)) {
      return; // no overwrite
    }
    this.indexes.push(key);
    this.map.set(key, value);
  }

  @action
  addValue(value: V): void {
    if (!this.toKey) {
      throw Error('no toKey method');
    }
    this.add(this.toKey(value), value);
  }

  @action
  remove(key: K): void {
    if (!this.map.has(key)) {
      return;
    }
    this.map.delete(key);
    this.indexes.remove(key);
  }

  @action
  removeAll(): void {
    this.indexes.clear();
    this.map.clear();
  }

  @action
  bulkUpdate(values: V[]): void {
    if (!this.toKey) {
      throw Error('no toKey method');
    }
    values.forEach(v => this.add(this.toKey!(v), v));
  }

  @action
  bulkRewrite(values: V[]): void {
    this.removeAll();
    this.bulkUpdate(values);
  }

  @action
  sort(comparator: (a: V, B: V) => number): void {
    const sorted = this.indexes
      .slice()
      .sort((a, b) => comparator(this.map.get(a)!, this.map.get(b)!));
    this.indexes.replace(sorted);
  }
}
