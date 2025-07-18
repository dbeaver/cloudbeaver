/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createContext } from 'react';

import type { SqlResultColumn } from '@cloudbeaver/core-sdk';
import type {
  DatabaseEditChangeType,
  IResultSetColumnKey,
  IResultSetElementKey,
  IResultSetRowKey,
  IResultSetValue,
  ResultSetDataAction,
  ResultSetDataContentAction,
  ResultSetEditAction,
  ResultSetFormatAction,
  ResultSetViewAction,
} from '@cloudbeaver/plugin-data-viewer';

export interface IColumnInfo {
  key: IResultSetColumnKey | null;
}

export interface ITableData {
  format: ResultSetFormatAction;
  dataContent: ResultSetDataContentAction;
  data: ResultSetDataAction;
  editor: ResultSetEditAction;
  hasDescription: boolean;
  view: ResultSetViewAction;
  columns: Array<IColumnInfo>;
  columnKeys: IResultSetColumnKey[];
  rows: IResultSetRowKey[];
  gridDiv: HTMLDivElement | null;
  inBounds: (position: IResultSetElementKey) => boolean;
  getRow: (rowIndex: number) => IResultSetRowKey | undefined;
  getColumn: (columnIndex: number) => IColumnInfo | undefined;
  getColumnByDataIndex: (key: IResultSetColumnKey) => IColumnInfo;
  getCellValue: (key: IResultSetElementKey) => IResultSetValue | undefined;
  getColumnInfo: (key: IResultSetColumnKey) => SqlResultColumn | undefined;
  getColumnsInRange: (startIndex: number, endIndex: number) => Array<IColumnInfo>;
  getColumnIndexFromColumnKey: (column: IResultSetColumnKey) => number;
  getRowIndexFromKey: (row: IResultSetRowKey) => number;
  getEditionState: (key: IResultSetElementKey) => DatabaseEditChangeType | null;
  isCellEdited: (key: IResultSetElementKey) => boolean;
  isIndexColumn: (columnKey: IColumnInfo) => boolean;
  isIndexColumnInRange: (columnsRange: Array<IColumnInfo>) => boolean;
  isCellReadonly: (key: IResultSetElementKey) => boolean;
}

export const TableDataContext = createContext<ITableData>(undefined as any);
