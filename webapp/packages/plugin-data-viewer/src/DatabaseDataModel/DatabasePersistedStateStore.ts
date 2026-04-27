/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observable } from 'mobx';

import type { IDatabasePersistedStateStore } from './IDatabasePersistedStateStore.js';

export class DatabasePersistedStateStore implements IDatabasePersistedStateStore {
  private readonly store = observable.map<string, unknown>();
  private external: Record<string, unknown> | null = null;

  setStore(external: Record<string, unknown>): void {
    this.external = external;
    this.store.replace(Object.entries(external));
  }

  has(key: string): boolean {
    return this.store.has(key);
  }

  get<T>(key: string): T | undefined {
    return this.store.get(key) as T | undefined;
  }

  set(key: string, value: unknown): void {
    this.store.set(key, value);
    // Mirror into the external tab-state object so it persists on serialization.
    if (this.external) {
      this.external[key] = value;
    }
  }

  delete(key: string): void {
    this.store.delete(key);
    if (this.external) {
      delete this.external[key];
    }
  }
}
