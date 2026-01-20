/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { MetadataMap } from '@cloudbeaver/core-utils';

export interface IDataGridSearchPersistent {
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

export const SEARCH_PERSISTENCE_PREFIX = 'data-grid-search';

export function createDefaultSearchPersistent(): IDataGridSearchPersistent {
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
export class SearchPersistenceService {
  private readonly store = new MetadataMap<string, IDataGridSearchPersistent>(() => createDefaultSearchPersistent());

  get(key: string): IDataGridSearchPersistent {
    return this.store.get(key);
  }

  set(key: string, value: IDataGridSearchPersistent): void {
    this.store.set(key, value);
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clearByPrefix(prefix: string): void {
    for (const k of Array.from(this.store.keys())) {
      if (k.startsWith(prefix)) {
        this.store.delete(k);
      }
    }
  }
}

