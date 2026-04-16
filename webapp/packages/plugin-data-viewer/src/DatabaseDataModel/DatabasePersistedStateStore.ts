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
  private version: number;

  constructor() {
    this.store = {};
    this.version = 0;

    makeObservable<this, 'store' | 'version'>(this, {
      store: observable.ref,
      version: observable,
      setStore: action,
      set: action,
      delete: action,
    });
  }

  setStore(store: Record<string, unknown>): void {
    this.store = store;
    this.version++;
  }

  has(key: string): boolean {
    this.observeVersion();
    return key in this.store;
  }

  get<T>(key: string): T | undefined {
    this.observeVersion();
    return this.store[key] as T | undefined;
  }

  set(key: string, value: unknown): void {
    if (this.store[key] === value) {
      return;
    }

    this.store[key] = value;
    this.version++;
  }

  delete(key: string): void {
    if (!(key in this.store)) {
      return;
    }

    delete this.store[key];
    this.version++;
  }

  private observeVersion(): number {
    return this.version;
  }
}
