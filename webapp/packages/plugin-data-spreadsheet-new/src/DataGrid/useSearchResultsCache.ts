/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useMemo } from 'react';

import type { IGridSearchStorage, IGridSearchStorageState } from '@cloudbeaver/plugin-data-grid';
import type { ResultSetCacheAction } from '@cloudbeaver/plugin-data-viewer';

const SEARCH_STORAGE_KEY = Symbol('grid-search-storage');

export function useSearchResultsCache(cacheAction: ResultSetCacheAction): IGridSearchStorage {
  return useMemo<IGridSearchStorage>(
    () => ({
      get(): IGridSearchStorageState | undefined {
        return cacheAction.getShared<IGridSearchStorageState>(SEARCH_STORAGE_KEY);
      },
      set(state: IGridSearchStorageState): void {
        cacheAction.setShared(SEARCH_STORAGE_KEY, state);
      },
      update(partial: Partial<IGridSearchStorageState>): void {
        const current = cacheAction.getShared<IGridSearchStorageState>(SEARCH_STORAGE_KEY);
        if (current) {
          cacheAction.setShared(SEARCH_STORAGE_KEY, { ...current, ...partial });
        }
      },
    }),
    [cacheAction],
  );
}
