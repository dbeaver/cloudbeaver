
/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createContext } from 'react';

import type { SqlDataFilterConstraint } from '@cloudbeaver/core-sdk';
import type { SortMode } from '@cloudbeaver/plugin-data-viewer';

export interface IDataGridSortingContext {
  sortedColumns: Map<string, SqlDataFilterConstraint>;
  setSortMode: (colId: string, sort: SortMode, multiple: boolean) => Promise<void> | void;
  getSortMode: (colId: string) => SortMode;
}

export const DataGridSortingContext = createContext<IDataGridSortingContext | null>(null);
