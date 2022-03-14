/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createContext } from 'react';
import type { Column } from 'react-data-grid';

import type { SqlResultColumn } from '@cloudbeaver/core-sdk';
import type {
  IResultSetColumnKey, IResultSetElementKey, IResultSetRowKey, IResultSetValue, DatabaseEditChangeType,
  ResultSetDataAction, ResultSetEditAction, ResultSetFormatAction, ResultSetViewAction, ResultSetConstraintAction
} from '@cloudbeaver/plugin-data-viewer';

declare module 'react-data-grid' {
  interface Column<TRow, TSummaryRow = unknown> {
    columnDataIndex: IResultSetColumnKey | null;
    icon?: string;
  }
}

interface IColumnMetrics {
  width: number;
  left: number;
  right: number;
}

export interface ITableData {
  format: ResultSetFormatAction;
  data: ResultSetDataAction;
  editor: ResultSetEditAction;
  view: ResultSetViewAction;
  constraints: ResultSetConstraintAction;
  columns: Array<Column<IResultSetRowKey, any>>;
  columnKeys: IResultSetColumnKey[];
  rows: IResultSetRowKey[];
  gridDiv: HTMLDivElement | null;
  getMetrics: (columnIndex: number) => IColumnMetrics;
  getRow: (rowIndex: number) => IResultSetRowKey;
  getColumn: (columnIndex: number) => Column<IResultSetRowKey, any>;
  getColumnByDataIndex: (key: IResultSetColumnKey) => Column<IResultSetRowKey, any>;
  getCellValue: (key: IResultSetElementKey) => IResultSetValue | undefined;
  getColumnInfo: (key: IResultSetColumnKey) => SqlResultColumn | undefined;
  getColumnsInRange: (startIndex: number, endIndex: number) => Array<Column<IResultSetRowKey, any>>;
  getColumnIndexFromKey: (columnKey: string) => number;
  getColumnIndexFromColumnKey: (column: IResultSetColumnKey) => number;
  getRowIndexFromKey: (row: IResultSetRowKey) => number;
  getEditionState: (key: IResultSetElementKey) => DatabaseEditChangeType | null;
  isCellEdited: (key: IResultSetElementKey) => boolean;
  isIndexColumn: (columnKey: string) => boolean;
  isIndexColumnInRange: (columnsRange: Array<Column<IResultSetRowKey, any>>) => boolean;
  isReadOnly: () => boolean;
  isCellReadonly: (key: Partial<IResultSetElementKey>) => boolean;
}

export const TableDataContext = createContext<ITableData>(undefined as any);
