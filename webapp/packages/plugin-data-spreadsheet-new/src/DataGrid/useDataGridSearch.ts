/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useLayoutEffect, useMemo } from 'react';
import { useService } from '@cloudbeaver/core-di';
import { SearchStateService, SEARCH_STATE_PREFIX } from '../DataGridSearchStateService.js';
import { DataGridSearchStore, type IDataGridSearchState } from './DataGridSearchStore.js';


//TODO:
// 1. Optimize search for large datasets (add limit, debounce, web worker, etc.)
export function useDataGridSearch(modelId: string, resultIndex: number): IDataGridSearchState {
  const key = `${SEARCH_STATE_PREFIX}-${modelId}-${resultIndex}`;
  const persistence = useService(SearchStateService);
  const persisted = useMemo(() => persistence.get(key), [key, persistence]);

  const store = useMemo(
    () =>
      persistence.getOrCreateStore(key, () => new DataGridSearchStore(persisted)),
    [key, persisted, persistence],
  );

  useLayoutEffect(() => {
    store.attachPersistence(persisted);
  }, [store, persisted]);

  return store;
}
