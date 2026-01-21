/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';

import { createDefaultSearchCache, GridSearchStore } from './GridSearchStore.js';

@injectable()
export class GridSearchService {
  private readonly stores = new Map<string, GridSearchStore>();

  getOrCreateStore(key: string): GridSearchStore {
    if (this.stores.has(key)) {
      return this.stores.get(key)!;
    }

    const store = new GridSearchStore(createDefaultSearchCache());
    this.stores.set(key, store);
    return store;
  }

  delete(key: string): void {
    const store = this.stores.get(key);
    if (store) {
      store.dispose();
      this.stores.delete(key);
    }
  }

  clearByPrefix(prefix: string): void {
    for (const [key, store] of this.stores) {
      if (key.startsWith(prefix)) {
        store.dispose();
        this.stores.delete(key);
      }
    }
  }

  clearAll(): void {
    for (const store of this.stores.values()) {
      store.dispose();
    }
    this.stores.clear();
  }

  has(key: string): boolean {
    return this.stores.has(key);
  }
}
