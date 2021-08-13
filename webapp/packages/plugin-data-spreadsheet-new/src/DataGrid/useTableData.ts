/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed, observable } from 'mobx';
import type { Column } from 'react-data-grid';

import { useObjectRef } from '@cloudbeaver/core-blocks';
import type { SqlResultColumn } from '@cloudbeaver/core-sdk';
import { TextTools, uuid } from '@cloudbeaver/core-utils';
import { IDatabaseDataModel, IDatabaseResultSet, ResultSetDataAction, ResultSetFormatAction } from '@cloudbeaver/plugin-data-viewer';

import { IndexFormatter } from './Formatters/IndexFormatter';
import { TableColumnHeader } from './TableColumnHeader/TableColumnHeader';
import { TableIndexColumnHeader } from './TableColumnHeader/TableIndexColumnHeader';
import type { ITableData } from './TableDataContext';

export const indexColumn: Column<any[], any> = {
  key: '#',
  columnDataIndex: null,
  name: '#',
  minWidth: 60,
  width: 60,
  resizable: false,
  frozen: true,
  headerRenderer: TableIndexColumnHeader,
  formatter: IndexFormatter,
};

export function useTableData(model: IDatabaseDataModel<any, IDatabaseResultSet>, resultIndex: number): ITableData {
  const format = model.source.getAction(resultIndex, ResultSetFormatAction);
  const data = model.source.getAction(resultIndex, ResultSetDataAction);
  const editor = model.source.getEditor(resultIndex);

  const props = useObjectRef({
    format,
    data,
    editor,
  },
  undefined,
  {
    format: observable.ref,
    data: observable.ref,
    editor: observable.ref,
  });

  return useObjectRef({
    get format() {
      return props.format;
    },
    get data() {
      return props.data;
    },
    get editor() {
      return props.editor;
    },
    get dataColumns() {
      return this.data.columns;
    },
    get dataRows() {
      return this.data.rows;
    },
    get columns() {
      if (this.dataColumns.length === 0) {
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

      const columns: Array<Column<any[], any>> = this.dataColumns.map<Column<any[], any>>((col, columnIndex) => ({
        key: uuid(),
        columnDataIndex: columnIndex,
        name: col.label!,
        editable: true,
        width: Math.min(300, measuredCells[columnIndex]),
        headerRenderer: TableColumnHeader,
      }));
      columns.unshift(indexColumn);

      return columns;
    },
    getColumn(columnIndex: number) {
      return this.columns[columnIndex];
    },
    getColumnByDataIndex(columnDataIndex: number) {
      return this.columns.find(column => column.columnDataIndex === columnDataIndex)!;
    },
    getColumnInfo(columnDataIndex: number): SqlResultColumn | undefined {
      return this.data.getColumn(columnDataIndex);
    },
    getCellValue(row: number, column: number) {
      return this.editor.getCell(row, column);
      // return props.data.getCellValue({ column, row });
    },
    getColumnIndexFromKey(key: string) {
      return this.columns.findIndex(column => column.key === key);
    },
    getColumnsInRange(startIndex: number, endIndex: number) {
      if (startIndex === endIndex) {
        return [this.columns[startIndex]];
      }

      const firstIndex = Math.min(startIndex, endIndex);
      const lastIndex = Math.max(startIndex, endIndex);
      return this.columns.slice(firstIndex, lastIndex + 1);
    },
    isCellEdited(rowIndex: number, column: Column<any[], any>) {
      if (column.columnDataIndex === null) {
        return false;
      }
      return this.editor.isCellEdited(rowIndex, column.columnDataIndex);
    },
    isIndexColumn(columnKey: string) {
      return columnKey === indexColumn.key;
    },
    isIndexColumnInRange(columnsRange: Array<Column<any[], any>>) {
      return columnsRange.some(column => this.isIndexColumn(column.key));
    },
    isReadOnly() {
      return this.dataColumns.every(column => column.readOnly);
    },
  }, null, {
    columns: computed,
    dataColumns: computed,
    dataRows: computed,
  });
}
