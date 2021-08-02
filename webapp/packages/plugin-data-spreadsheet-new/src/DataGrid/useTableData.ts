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
import { TextTools } from '@cloudbeaver/core-utils';
import { IDatabaseDataModel, IDatabaseResultSet, ResultSetFormatAction } from '@cloudbeaver/plugin-data-viewer';

import { ResultSetTools } from '../ResultSetTools';
import { IndexFormatter } from './Formatters/IndexFormatter';
import { TableColumnHeader } from './TableColumnHeader/TableColumnHeader';
import { TableIndexColumnHeader } from './TableColumnHeader/TableIndexColumnHeader';
import type { ITableData } from './TableDataContext';

export const indexColumn: Column<any[], any> = {
  key: String(Number.MAX_SAFE_INTEGER),
  name: '#',
  minWidth: 60,
  width: 60,
  resizable: false,
  frozen: true,
  headerRenderer: TableIndexColumnHeader,
  formatter: IndexFormatter,
};

export function useTableData(model: IDatabaseDataModel<any, IDatabaseResultSet>, resultIndex: number): ITableData {
  const modelResultData = model.getResult(resultIndex);
  const props = useObjectRef({
    modelResultData,
    model,
    resultIndex,
  },
  undefined,
  {
    modelResultData: observable.ref,
    model: observable.ref,
    resultIndex: observable.ref,
  });

  return useObjectRef({
    get dataColumns() {
      return props.modelResultData?.data?.columns || [];
    },
    get dataRows() {
      return props.modelResultData?.data?.rows || [];
    },
    get data() {
      if (!props.modelResultData?.data) {
        return { columns: [], rows: [] };
      }

      const format = model.source.getAction(resultIndex, ResultSetFormatAction);

      // TODO: seems it must be moved to ResultSetFormatAction
      const columnNames = ResultSetTools.getHeaders(props.modelResultData.data);
      const rowStrings = ResultSetTools.getLongestCells(props.modelResultData.data);

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

      // TODO: we need some result type specified formatter to common actions with data
      const rows = props.modelResultData.data?.rows || [];

      const columns = props.modelResultData.data?.columns!.map<Column<any[], any>>((col, columnIndex) => ({
        key: columnIndex + '',
        name: col.label!,
        editable: !format.isReadOnly({ column: columnIndex }),
        width: Math.min(300, measuredCells[columnIndex]),
        headerRenderer: TableColumnHeader,
      })) || [];
      columns.unshift(indexColumn);

      return { rows, columns };
    },
    getCellValue(rowIndex: number, key: string | number): any {
      return this.data.rows[rowIndex][key as number];
    },
    getColumnInfo(key: string | number): SqlResultColumn | undefined {
      if (this.isIndexColumn(key)) {
        return;
      }

      return this.dataColumns[Number(key)]; // performance heavy
    },
    getDataColumnIndexFromKey(key: string | number) {
      const info = this.getColumnInfo(key);

      if (!info) {
        return null;
      }

      return Number(key);
    },
    getColumnIndexFromKey(key: string | number) {
      const index = this.data.columns.findIndex((column: any) => column.key === String(key));
      return index === -1 ? null : index;
    },
    getColumnsInRange(startIndex: number, endIndex: number) {
      if (startIndex === endIndex) {
        return [this.data.columns[startIndex]];
      }

      const firstIndex = Math.min(startIndex, endIndex);
      const lastIndex = Math.max(startIndex, endIndex);
      return this.data.columns.slice(firstIndex, lastIndex + 1);
    },
    isIndexColumn(columnKey: string | number) {
      return String(columnKey) === indexColumn.key;
    },
    isIndexColumnInRange(columnsRange: Array<Column<any[], any>>) {
      return columnsRange.some(column => this.isIndexColumn(column.key));
    },
    isReadOnly() {
      return this.dataColumns.every(column => column.readOnly);
    },
    getColumnKeyFromColumnIndex(columnIndex: number) {
      return Number(this.data.columns[columnIndex].key);
    },
  }, null, {
    data: computed,
    dataColumns: computed,
    dataRows: computed,
  });
}
