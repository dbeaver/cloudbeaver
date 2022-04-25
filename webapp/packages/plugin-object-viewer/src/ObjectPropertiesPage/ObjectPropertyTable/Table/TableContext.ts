/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createContext } from 'react';

import type { TableState } from '@cloudbeaver/core-blocks';

import type { ITableData } from './useTableData';

interface ITableContext {
  tableData: ITableData | null;
  tableState: TableState | null;
}

export const TableContext = createContext<ITableContext>({
  tableData: null,
  tableState: null,
});