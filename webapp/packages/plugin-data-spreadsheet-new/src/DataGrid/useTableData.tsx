/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed, observable } from 'mobx';

import { useObservableRef } from '@cloudbeaver/core-blocks';
import { TextTools } from '@cloudbeaver/core-utils';
import {
  IDatabaseDataModel,
  IDatabaseResultSet,
  IResultSetColumnKey,
  IResultSetElementKey,
  IResultSetRowKey,
  ResultSetConstraintAction,
  ResultSetDataAction,
  ResultSetDataContentAction,
  ResultSetDataKeysUtils,
  ResultSetEditAction,
  ResultSetFormatAction,
  ResultSetViewAction,
} from '@cloudbeaver/plugin-data-viewer';
import type { Column } from '@cloudbeaver/plugin-react-data-grid';

import { IndexFormatter } from './Formatters/IndexFormatter';
import { TableColumnHeader } from './TableColumnHeader/TableColumnHeader';
import { TableIndexColumnHeader } from './TableColumnHeader/TableIndexColumnHeader';
import type { ITableData } from './TableDataContext';

export const indexColumn: Column<IResultSetRowKey, any> = {
  key: 'index',
  columnDataIndex: null,
  name: '#',
  minWidth: 60,
  width: 60,
  resizable: false,
  frozen: true,
  renderHeaderCell: props => <TableIndexColumnHeader {...props} />,
  renderCell: props => <IndexFormatter {...props} />,
};

const COLUMN_PADDING = 16 + 2;
const COLUMN_HEADER_ICON_WIDTH = 16;
const COLUMN_HEADER_TEXT_PADDING = 8;
const COLUMN_HEADER_ORDER_PADDING = 8;
const COLUMN_HEADER_ORDER_WIDTH = 16;

const FONT = '400 12px Roboto';

export function useTableData(
  model: IDatabaseDataModel<any, IDatabaseResultSet>,
  resultIndex: number,
  gridDIVElement: React.RefObject<HTMLDivElement | null>,
): ITableData {
  const format = model.source.getAction(resultIndex, ResultSetFormatAction);
  const data = model.source.getAction(resultIndex, ResultSetDataAction);
  const editor = model.source.getAction(resultIndex, ResultSetEditAction);
  const view = model.source.getAction(resultIndex, ResultSetViewAction);
  const dataContent = model.source.getAction(resultIndex, ResultSetDataContentAction);
  const constraints = model.source.getAction(resultIndex, ResultSetConstraintAction);

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
        const columnNames = this.format.getHeaders();
        const rowStrings = this.format.getLongestCells();

        const columnsWidth = TextTools.getWidth({
          font: FONT,
          text: columnNames,
        }).map(
          width =>
            width + COLUMN_PADDING + COLUMN_HEADER_ICON_WIDTH + COLUMN_HEADER_TEXT_PADDING + COLUMN_HEADER_ORDER_PADDING + COLUMN_HEADER_ORDER_WIDTH,
        );

        const cellsWidth = TextTools.getWidth({
          font: FONT,
          text: rowStrings,
        }).map(width => width + COLUMN_PADDING);

        const columns: Array<Column<IResultSetRowKey, any>> = this.columnKeys.map<Column<IResultSetRowKey, any>>((col, index) => ({
          key: ResultSetDataKeysUtils.serialize(col),
          columnDataIndex: col,
          name: this.getColumnInfo(col)?.label || '?',
          editable: true,
          width: Math.min(300, Math.max(columnsWidth[index], cellsWidth[index] ?? 0)),
          renderHeaderCell: props => <TableColumnHeader {...props} />,
        }));
        columns.unshift(indexColumn);

        return columns;
      },
      getMetrics(columnIndex) {
        if (columnIndex < 0 || columnIndex > this.columns.length) {
          return undefined;
        }

        let left = 0;
        for (let i = 0; i < columnIndex; i++) {
          const column = this.columns[i];
          left += column.width as number;
        }

        const column = this.getColumn(columnIndex)!;

        return {
          left,
          right: left + (column.width as number),
          width: column.width as number,
        };
      },
      getRow(rowIndex) {
        return this.rows[rowIndex];
      },
      getColumn(columnIndex) {
        return this.columns[columnIndex];
      },
      getColumnByDataIndex(key) {
        return this.columns.find(column => column.columnDataIndex !== null && ResultSetDataKeysUtils.isEqual(column.columnDataIndex, key))!;
      },
      getColumnInfo(key) {
        return this.data.getColumn(key);
      },
      getCellValue(key) {
        return this.view.getCellValue(key);
      },
      getColumnIndexFromKey(key) {
        return this.columns.findIndex(column => column.key === key);
      },
      getColumnIndexFromColumnKey(columnKey) {
        return this.columns.findIndex(column => column.columnDataIndex !== null && ResultSetDataKeysUtils.isEqual(columnKey, column.columnDataIndex));
      },
      getRowIndexFromKey(rowKey) {
        return this.rows.findIndex(row => ResultSetDataKeysUtils.isEqual(rowKey, row));
      },
      getColumnsInRange(startIndex, endIndex) {
        if (startIndex === endIndex) {
          return [this.columns[startIndex]];
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
        return columnKey === indexColumn.key;
      },
      isIndexColumnInRange(columnsRange) {
        return columnsRange.some(column => this.isIndexColumn(column.key));
      },
      isReadOnly() {
        return this.columnKeys.every(column => this.getColumnInfo(column)?.readOnly);
      },
      isCellReadonly(key: Partial<IResultSetElementKey>) {
        if (!key.column) {
          return true;
        }

        const column = this.getColumnByDataIndex(key.column);

        return !column.editable || this.format.isReadOnly(key);
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
      constraints: observable.ref,
      gridDIVElement: observable.ref,
    },
    {
      format,
      dataContent,
      data,
      editor,
      view,
      constraints,
      gridDIVElement,
    },
  );
}
