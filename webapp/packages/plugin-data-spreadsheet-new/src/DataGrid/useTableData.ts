/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed, observable } from 'mobx';
import type { Column } from 'react-data-grid';

import { useObservableRef } from '@cloudbeaver/core-blocks';
import { TextTools, uuid } from '@cloudbeaver/core-utils';
import {
  IDatabaseDataModel, IDatabaseResultSet, IResultSetColumnKey, IResultSetElementKey, IResultSetRowKey,
  ResultSetConstraintAction, ResultSetDataAction, ResultSetDataKeysUtils,
  ResultSetEditAction, ResultSetFormatAction, ResultSetViewAction
} from '@cloudbeaver/plugin-data-viewer';

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
  headerRenderer: TableIndexColumnHeader,
  formatter: IndexFormatter,
};

export function useTableData(
  model: IDatabaseDataModel<any, IDatabaseResultSet>,
  resultIndex: number,
  gridDIVElement: React.RefObject<HTMLDivElement | null>,
  onCellKeyDown?: (event: React.KeyboardEvent<HTMLDivElement>) => void
): ITableData {
  const format = model.source.getAction(resultIndex, ResultSetFormatAction);
  const data = model.source.getAction(resultIndex, ResultSetDataAction);
  const editor = model.source.getAction(resultIndex, ResultSetEditAction);
  const view = model.source.getAction(resultIndex, ResultSetViewAction);
  const constraints = model.source.getAction(resultIndex, ResultSetConstraintAction);

  return useObservableRef<ITableData & { gridDIVElement: React.RefObject<HTMLDivElement | null> }>(() => ({
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

      // TODO: seems better to do not measure container size
      //       for detecting max columns size, better to use configurable variable
      const measuredCells = TextTools.getWidth({
        font: '400 14px Roboto',
        text: columnNames.map((cell, i) => {
          if (cell.length > (rowStrings[i] || '').length) {
            return cell;
          }
          return rowStrings[i];
        }),
      }).map(v => v + 16 + 32 + 20);

      const columns: Array<Column<IResultSetRowKey, any>> = this.columnKeys.map<Column<IResultSetRowKey, any>>(
        (col, index) => ({
          key: uuid(),
          columnDataIndex: { index },
          name: this.getColumnInfo(col)?.label || '?',
          editable: true,
          width: Math.min(300, measuredCells[index]),
          headerRenderer: TableColumnHeader,
          editorOptions: {
            onCellKeyDown,
          },
        }));
      columns.unshift(indexColumn);

      return columns;
    },
    getMetrics(columnIndex) {
      let left = 0;
      for (let i = 0; i < columnIndex; i++) {
        const column = this.columns[i];
        left += column.width as number;
      }

      const column = this.getColumn(columnIndex);

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
      return this.columns.find(column => (
        column.columnDataIndex !== null
        && ResultSetDataKeysUtils.isEqual(column.columnDataIndex, key)
      ))!;
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
      return this.columns
        .findIndex(column => (
          column.columnDataIndex !== null
          && ResultSetDataKeysUtils.isEqual(columnKey, column.columnDataIndex)
        ));
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

      return (
        !column.editable
        || this.format.isReadOnly(key)
      );
    },
  }), {
    columns: computed,
    rows: computed,
    columnKeys: computed,
    format: observable.ref,
    data: observable.ref,
    editor: observable.ref,
    view: observable.ref,
    constraints: observable.ref,
    gridDIVElement: observable.ref,
  }, {
    format,
    data,
    editor,
    view,
    constraints,
    gridDIVElement,
  });
}
