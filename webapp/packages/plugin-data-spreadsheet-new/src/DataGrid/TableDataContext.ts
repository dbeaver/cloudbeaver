/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createContext } from 'react';
import type { Column } from 'react-data-grid';

import type { SqlResultColumn } from '@cloudbeaver/core-sdk';

export interface ITableData {
  data: {
    columns: Array<Column<any[], any>>;
    rows: any[][];
  };
  dataColumns: SqlResultColumn[];
  dataRows: any[][];
  getCellValue: (rowIndex: number, key: string | number) => any;
  getColumnInfo: (key: string | number) => SqlResultColumn | undefined;
  getColumnsInRange: (startIndex: number, endIndex: number) => Array<Column<any[], any>>;
  getDataColumnIndexFromKey: (columnKey: string | number) => number | null;
  getColumnIndexFromKey: (columnKey: string | number) => number | null;
  isIndexColumn: (columnKey: string | number) => boolean;
  isIndexColumnInRange: (columnsRange: Array<Column<any[], any>>) => boolean;
  isReadOnly: () => boolean;
  getColumnKeyFromColumnIndex: (columnIndex: number) => number;
}

export const TableDataContext = createContext<ITableData | null>(null);
