/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed, observable } from 'mobx';

import { useObservableRef } from '@cloudbeaver/core-blocks';
import {
  type IDatabaseDataModel,
  type IResultSetColumnKey,
  type IResultSetElementKey,
  type IResultSetRowKey,
  ResultSetDataAction,
  ResultSetDataContentAction,
  ResultSetDataKeysUtils,
  ResultSetDataSource,
  ResultSetEditAction,
  ResultSetFormatAction,
  ResultSetViewAction,
} from '@cloudbeaver/plugin-data-viewer';

import type { IColumnInfo, ITableData } from './TableDataContext.js';

export function useTableData(
  model: IDatabaseDataModel<ResultSetDataSource>,
  resultIndex: number,
  gridDIVElement: React.RefObject<HTMLDivElement | null>,
): ITableData {
  const format = model.source.getAction(resultIndex, ResultSetFormatAction);
  const data = model.source.getAction(resultIndex, ResultSetDataAction);
  const editor = model.source.getAction(resultIndex, ResultSetEditAction);
  const view = model.source.getAction(resultIndex, ResultSetViewAction);
  const dataContent = model.source.getAction(resultIndex, ResultSetDataContentAction);

  return useObservableRef<ITableData & { gridDIVElement: React.RefObject<HTMLDivElement | null> }>(
    () => ({
      get gridDiv(): HTMLDivElement | null {
        return this.gridDIVElement.current;
      },
      get columnKeys(): IResultSetColumnKey[] {
        return this.view.columnKeys;
      },
      get rows(): IResultSetRowKey[] {
        return this.view.rowKeys;
      },
      get columns() {
        if (this.columnKeys.length === 0) {
          return [];
        }

        const columns: Array<IColumnInfo> = this.columnKeys.map<IColumnInfo>(col => ({
          key: col,
        }));
        columns.unshift({ key: null });

        return columns;
      },
      getRow(rowIndex) {
        return this.rows[rowIndex];
      },
      getColumn(columnIndex) {
        return this.columns[columnIndex];
      },
      getColumnByDataIndex(key) {
        return this.columns.find(column => column.key !== null && ResultSetDataKeysUtils.isEqual(column.key, key))!;
      },
      getColumnInfo(key) {
        return this.data.getColumn(key);
      },
      getCellValue(key) {
        return this.view.getCellValue(key);
      },
      getColumnIndexFromColumnKey(columnKey) {
        return this.columns.findIndex(column => column.key !== null && ResultSetDataKeysUtils.isEqual(columnKey, column.key));
      },
      getRowIndexFromKey(rowKey) {
        return this.rows.findIndex(row => ResultSetDataKeysUtils.isEqual(rowKey, row));
      },
      getColumnsInRange(startIndex, endIndex): IColumnInfo[] {
        if (startIndex === endIndex) {
          return [this.columns[startIndex]!];
        }

        const firstIndex = Math.min(startIndex, endIndex);
        const lastIndex = Math.max(startIndex, endIndex);
        return this.columns.slice(firstIndex, lastIndex + 1);
      },
      getEditionState(key) {
        return this.editor.getElementState(key);
      },
      inBounds(position) {
        return this.view.has(position);
      },
      isCellEdited(key) {
        return this.editor.isElementEdited(key);
      },
      isIndexColumn(columnKey) {
        return columnKey.key === null;
      },
      isIndexColumnInRange(columnsRange) {
        return columnsRange.some(column => this.isIndexColumn(column));
      },
      isReadOnly() {
        return this.columnKeys.every(column => this.getColumnInfo(column)?.readOnly);
      },
      isCellReadonly(key: Partial<IResultSetElementKey>) {
        if (!key.column) {
          return true;
        }

        return this.format.isReadOnly(key);
      },
    }),
    {
      columns: computed,
      rows: computed,
      columnKeys: computed,
      format: observable.ref,
      dataContent: observable.ref,
      data: observable.ref,
      editor: observable.ref,
      view: observable.ref,
      gridDIVElement: observable.ref,
    },
    {
      format,
      dataContent,
      data,
      editor,
      view,
      gridDIVElement,
    },
  );
}
