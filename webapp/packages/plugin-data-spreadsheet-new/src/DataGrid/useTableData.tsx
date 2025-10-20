/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed, observable } from 'mobx';

import { useObservableRef } from '@cloudbeaver/core-blocks';
import {
  DatabaseEditChangeType,
  type IDatabaseDataModel,
  ResultSetDataContentAction,
  GridDataKeysUtils,
  ResultSetDataSource,
  IDatabaseDataResultAction,
  IDatabaseDataEditAction,
  IDatabaseDataViewAction,
  IDatabaseDataFormatAction,
  GridDataResultAction,
  GridEditAction,
  GridViewAction,
  type IDatabaseValueHolder,
  type IResultSetValue,
  type IGridRowKey,
  type IGridColumnKey,
  type IGridDataKey,
} from '@cloudbeaver/plugin-data-viewer';

import type { IColumnInfo, ITableData } from './TableDataContext.js';
import { useService } from '@cloudbeaver/core-di';
import { DataGridSettingsService } from '../DataGridSettingsService.js';
import type { SqlResultColumn } from '@cloudbeaver/core-sdk';
import { GridConditionalFormattingAction } from '@cloudbeaver/plugin-data-viewer-conditional-formatting';

interface ITableDataPrivate extends ITableData {
  dataGridSettingsService: DataGridSettingsService;
  gridDIVElement: React.RefObject<HTMLDivElement | null>;
}

export function useTableData(
  model: IDatabaseDataModel<ResultSetDataSource>,
  resultIndex: number,
  gridDIVElement: React.RefObject<HTMLDivElement | null>,
): ITableData {
  const formatting = model.source.getAction(resultIndex, GridConditionalFormattingAction);
  const format = model.source.getAction(resultIndex, IDatabaseDataFormatAction);
  const data = model.source.getAction(resultIndex, IDatabaseDataResultAction, GridDataResultAction);
  const editor = model.source.tryGetAction(resultIndex, IDatabaseDataEditAction, GridEditAction);
  const view = model.source.getAction(resultIndex, IDatabaseDataViewAction, GridViewAction);
  const dataContent = model.source.getAction(resultIndex, ResultSetDataContentAction);
  const dataGridSettingsService = useService(DataGridSettingsService);

  return useObservableRef<ITableDataPrivate>(
    () => ({
      get gridDiv(): HTMLDivElement | null {
        return this.gridDIVElement.current;
      },
      get columnKeys(): IGridColumnKey[] {
        return this.view.columnKeys;
      },
      get rows(): IGridRowKey[] {
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
      get hasDescription(): boolean {
        if (!this.dataGridSettingsService.description) {
          return false;
        }

        // TODO: fix column abstraction
        return Boolean(this.data?.columns?.some(column => (column as SqlResultColumn).description));
      },
      getRow(rowIndex) {
        return this.rows[rowIndex];
      },
      getColumn(columnIndex) {
        return this.columns[columnIndex];
      },
      getColumnByDataIndex(key) {
        return this.columns.find(column => column.key !== null && GridDataKeysUtils.isEqual(column.key, key))!;
      },
      getColumnInfo(key) {
        // TODO: fix column abstraction
        return this.data.getColumn(key) as SqlResultColumn | undefined;
      },
      getCellHolder(key) {
        // TODO: fix cell value abstraction
        return this.view.getCellHolder(key) as IDatabaseValueHolder<IGridDataKey, IResultSetValue>;
      },
      getColumnIndexFromColumnKey(columnKey) {
        return this.columns.findIndex(column => column.key !== null && GridDataKeysUtils.isEqual(columnKey, column.key));
      },
      getRowIndexFromKey(rowKey) {
        return this.rows.findIndex(row => GridDataKeysUtils.isEqual(rowKey, row));
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
        return this.editor?.getElementState(key) ?? null;
      },
      inBounds(position) {
        return this.view.has(position);
      },
      isCellEdited(key) {
        return this.editor?.isElementEdited(key) ?? false;
      },
      isIndexColumn(columnKey) {
        return columnKey.key === null;
      },
      isIndexColumnInRange(columnsRange) {
        return columnsRange.some(column => this.isIndexColumn(column));
      },
      isReadOnly() {
        return dataContent.source.isReadonly(resultIndex);
      },
      isCellReadonly(key: IGridDataKey) {
        if (!key.column) {
          return true;
        }

        return model.isReadonly(resultIndex) || (this.format.isReadOnly(key) && this.editor?.getElementState(key) !== DatabaseEditChangeType.add);
      },
    }),
    {
      columns: computed,
      rows: computed,
      columnKeys: computed,
      hasDescription: computed,
      formatting: observable.ref,
      format: observable.ref,
      dataContent: observable.ref,
      data: observable.ref,
      editor: observable.ref,
      view: observable.ref,
      gridDIVElement: observable.ref,
    },
    {
      formatting,
      format,
      dataContent,
      data,
      editor,
      view,
      gridDIVElement,
      dataGridSettingsService,
    },
  );
}
