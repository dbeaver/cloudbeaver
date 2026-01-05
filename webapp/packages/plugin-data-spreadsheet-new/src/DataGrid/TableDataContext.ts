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
  GridDataResultAction,
  GridEditAction,
  GridViewAction,
  IDatabaseDataFormatAction,
  IDatabaseResultSet,
  IGridColumnKey,
  IGridDataKey,
  IGridRowKey,
  IResultSetValue,
  IDatabaseValueHolder,
  ResultSetDataContentAction,
} from '@cloudbeaver/plugin-data-viewer';
import type { GridConditionalFormattingAction } from '@cloudbeaver/plugin-data-viewer-conditional-formatting';

export interface IColumnInfo {
  key: IGridColumnKey | null;
}

export interface ITableData {
  formatting: GridConditionalFormattingAction;
  format: IDatabaseDataFormatAction<Partial<IGridDataKey>, IResultSetValue, IDatabaseResultSet>;
  dataContent: ResultSetDataContentAction;
  data: GridDataResultAction;
  editor: GridEditAction | undefined;
  view: GridViewAction;
  hasDescription: boolean;
  columns: Array<IColumnInfo>;
  columnKeys: IGridColumnKey[];
  rows: IGridRowKey[];
  gridDiv: HTMLDivElement | null;
  inBounds: (position: IGridDataKey) => boolean;
  getRow: (rowIndex: number) => IGridRowKey | undefined;
  getColumn: (columnIndex: number) => IColumnInfo | undefined;
  getColumnByDataIndex: (key: IGridColumnKey) => IColumnInfo;
  getCellHolder: (key: IGridDataKey) => IDatabaseValueHolder<IGridDataKey, IResultSetValue>;
  getColumnInfo: (key: IGridColumnKey) => SqlResultColumn | undefined;
  getColumnsInRange: (startIndex: number, endIndex: number) => Array<IColumnInfo>;
  getColumnIndexFromColumnKey: (column: IGridColumnKey) => number;
  getRowIndexFromKey: (row: IGridRowKey) => number;
  getEditionState: (key: IGridDataKey) => DatabaseEditChangeType | null;
  isCellEdited: (key: IGridDataKey) => boolean;
  isIndexColumn: (columnKey: IColumnInfo) => boolean;
  isIndexColumnInRange: (columnsRange: Array<IColumnInfo>) => boolean;
  isCellReadonly: (key: IGridDataKey) => boolean;
}

export function isColumnInfo(column: IColumnInfo | undefined): column is IColumnInfo {
  return column?.key !== null;
}

export const TableDataContext = createContext<ITableData>(undefined as any);
