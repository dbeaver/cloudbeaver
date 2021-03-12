/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed } from 'mobx';
import { useState } from 'react';
import type { Column } from 'react-data-grid';

import { useObjectRef } from '@cloudbeaver/core-blocks';
import type { SqlResultColumn } from '@cloudbeaver/core-sdk';
import { TextTools } from '@cloudbeaver/core-utils';
import type { IDatabaseResultSet } from '@cloudbeaver/plugin-data-viewer';

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

export function useTableData(modelResultData: IDatabaseResultSet | null): ITableData {
  const props = useObjectRef({ modelResultData }, undefined, true);
  const [state] = useState(() => computed(() => {
    if (!props.modelResultData?.data) {
      return { columns: [], rows: [] };
    }

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
      editable: !col.readOnly,
      width: Math.min(300, measuredCells[columnIndex]),
      headerRenderer: TableColumnHeader,
    })) || [];
    columns.unshift(indexColumn);

    return { rows, columns };
  }));

  const { columns, rows } = state.get();

  return useObjectRef({
    columns,
    rows,
    get dataColumns() {
      return props.modelResultData?.data?.columns || [];
    },
    get dataRows() {
      return props.modelResultData?.data?.rows || [];
    },
    getCellValue(rowIndex: number, key: string | number): any {
      return this.rows[rowIndex][key as number];
    },
    getColumnInfo(key: string | number): SqlResultColumn | undefined {
      return props.modelResultData?.data?.columns?.[Number(key)];
    },
    getColumnIndexFromKey(key: string | number) {
      return this.columns.findIndex((column: any) => column.key === String(key));
    },
    getColumnsInRange(startIndex: number, endIndex: number) {
      if (startIndex === endIndex) {
        return [this.columns[startIndex]];
      }

      const firstIndex = Math.min(startIndex, endIndex);
      const lastIndex = Math.max(startIndex, endIndex);
      return this.columns.slice(firstIndex, lastIndex + 1);
    },
    isIndexColumn(columnKey: string | number) {
      return String(columnKey) === indexColumn.key;
    },
    isIndexColumnInRange(columnsRange: Array<Column<any[], any>>) {
      return columnsRange.some(column => this.isIndexColumn(column.key));
    },
    getColumnKeyFromColumnIndex(columnIndex: number) {
      return Number(this.columns[columnIndex].key);
    },
  }, {
    columns,
    rows,
  }, true);
}
