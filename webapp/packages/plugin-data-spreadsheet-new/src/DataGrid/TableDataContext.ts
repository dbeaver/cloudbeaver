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
import type { IDatabaseDataResultEditor, IDatabaseResultSet, IResultSetValue, ResultSetDataAction, ResultSetFormatAction } from '@cloudbeaver/plugin-data-viewer';

declare module 'react-data-grid' {
  interface Column<TRow, TSummaryRow = unknown> {
    columnDataIndex: null | number;
    icon?: string;
  }
}

export interface ITableData {
  format: ResultSetFormatAction;
  data: ResultSetDataAction;
  editor: IDatabaseDataResultEditor<IDatabaseResultSet>;
  columns: Array<Column<any[], any>>;
  dataColumns: SqlResultColumn[];
  dataRows: IResultSetValue[][];
  getColumn: (columnIndex: number) => Column<any[], any>;
  getColumnByDataIndex: (columnDataIndex: number) => Column<any[], any>;
  getCellValue: (rowIndex: number, columnIndex: number) => IResultSetValue | undefined;
  getColumnInfo: (columnDataIndex: number) => SqlResultColumn | undefined;
  getColumnsInRange: (startIndex: number, endIndex: number) => Array<Column<any[], any>>;
  getColumnIndexFromKey: (columnKey: string) => number;
  isCellEdited: (rowIndex: number, column: Column<any[], any>) => boolean;
  isIndexColumn: (columnKey: string) => boolean;
  isIndexColumnInRange: (columnsRange: Array<Column<any[], any>>) => boolean;
  isReadOnly: () => boolean;
}

export const TableDataContext = createContext<ITableData | null>(null);
