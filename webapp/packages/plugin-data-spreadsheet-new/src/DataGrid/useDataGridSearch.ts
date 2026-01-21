/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useMemo } from 'react';
import { useService } from '@cloudbeaver/core-di';
import { SearchStateService, SEARCH_STATE_PREFIX } from '../DataGridSearchStateService.js';
import type { IDataGridSearchState } from './DataGridSearchStore.js';

export function useDataGridSearch(modelId: string, resultIndex: number): IDataGridSearchState {
  const key = useMemo(
    () => `${SEARCH_STATE_PREFIX}-${modelId}-${resultIndex}`,
    [modelId, resultIndex],
  );
  
  const persistence = useService(SearchStateService);  
  const store = useMemo(
    () => persistence.getOrCreateStore(key),
    [key, persistence],
  );

  return store;
}
