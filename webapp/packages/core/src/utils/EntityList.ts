/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, computed, observable } from 'mobx';

export class EntityList<K, V> {
  private identifiers = observable.array<K>([]);
  @observable private map: Map<K, V> = new Map<K, V>();

  @computed get keys(): K[] {
    return this.identifiers;
  }

  @computed get values(): V[] {
    return this.identifiers.map(i => this.map.get(i)!);
  }

  constructor(private keySelector: (val: V) => K) { }

  get(key: K): V | undefined {
    return this.map.get(key);
  }

  has(key: K): boolean {
    return this.map.has(key);
  }

  @action
  set(value: V): void {
    const key = this.keySelector(value);
    this.identifiers.push(key);
    this.map.set(key, value);
  }

  @action
  remove(key: K): void {
    if (!this.map.has(key)) {
      return;
    }
    this.map.delete(key);
    this.identifiers.remove(key);
  }

  @action
  clear(): void {
    this.identifiers.clear();
    this.map.clear();
  }
}
