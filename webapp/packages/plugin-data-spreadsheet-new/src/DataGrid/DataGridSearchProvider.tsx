/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createContext, useContext } from 'react';

import type { IDataGridSearchState } from './useDataGridSearch.js';

export const DataGridSearchStateContext = createContext<IDataGridSearchState | null>(null);

export function useDataGridSearchState(): IDataGridSearchState {
  const context = useContext(DataGridSearchStateContext);
  if (!context) {
    throw new Error('useDataGridSearchState must be used within DataGridSearchStateProvider');
  }
  return context;
}
