/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, makeObservable, observable } from 'mobx';

import type { IDatabasePersistedStateStore } from './IDatabasePersistedStateStore.js';

export class DatabasePersistedStateStore implements IDatabasePersistedStateStore {
  private store: Record<string, unknown>;

  constructor() {
    this.store = {};

    makeObservable<this, 'store'>(this, {
      store: observable.ref,
      setStore: action,
      set: action,
      delete: action,
    });
  }

  setStore(store: Record<string, unknown>): void {
    this.store = store;
  }

  has(key: string): boolean {
    return key in this.store;
  }

  get<T>(key: string): T | undefined {
    return this.store[key] as T | undefined;
  }

  set(key: string, value: unknown): void {
    this.store[key] = value;
  }

  delete(key: string): void {
    delete this.store[key];
  }
}
