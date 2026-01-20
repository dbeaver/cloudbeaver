/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { DataGridSearchStore } from './DataGrid/DataGridSearchStore.js';

export interface IDataGridSearchCache {
  query: {
    search: string;
    replace: string;
    caseSensitive: boolean;
    wholeWord: boolean;
    regexp: boolean;
  };
  open: boolean;
  replaceOpen: boolean;
  activeMatchIdx: number;
}

export const SEARCH_STATE_PREFIX = 'data-grid-search';

export function createDefaultSearch(): IDataGridSearchCache {
  return {
    query: {
      search: '',
      replace: '',
      caseSensitive: false,
      wholeWord: false,
      regexp: false,
    },
    open: false,
    replaceOpen: false,
    activeMatchIdx: -1,
  };
}

@injectable()
export class SearchStateService {
  private readonly stores = new Map<string, DataGridSearchStore>();

  getOrCreateStore(key: string): DataGridSearchStore {
    if (this.stores.has(key)) {
      return this.stores.get(key)!;
    }

    const store = new DataGridSearchStore(createDefaultSearch());
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

