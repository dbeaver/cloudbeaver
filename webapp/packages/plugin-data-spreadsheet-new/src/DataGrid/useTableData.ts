/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed } from 'mobx';
import { useCallback, useMemo } from 'react';
import type { Column } from 'react-data-grid';

import type { SqlResultSet } from '@cloudbeaver/core-sdk';
import { TextTools } from '@cloudbeaver/core-utils';
import type { IDatabaseDataResult } from '@cloudbeaver/plugin-data-viewer';

import { ResultSetTools } from '../ResultSetTools';
import { IndexFormatter } from './Formatters/IndexFormatter';
import { TableColumnHeader } from './TableColumnHeader/TableColumnHeader';
import { TableIndexColumnHeader } from './TableColumnHeader/TableIndexColumnHeader';

export const indexColumn: Column<any[], any> = {
  key: Number.MAX_SAFE_INTEGER + '',
  name: '#',
  minWidth: 60,
  width: 60,
  resizable: false,
  frozen: true,
  headerRenderer: TableIndexColumnHeader,
  formatter: IndexFormatter,
};

export interface ITableData {
  columns: Array<Column<any[], any>>;
  rows: any[][];
  getColumnsInRange: (startIndex: number, endIndex: number) => Array<Column<any[], any>>;
  isIndexColumn: (columnKey: string) => boolean;
  isIndexColumnInRange: (columnsRange: Array<Column<any[], any>>) => boolean;
  getColumnKeyFromColumnIndex: (columnIndex: number) => string;
}

export function useTableData(modelResultData: IDatabaseDataResult | null): ITableData {
  const { columns, rows } = useMemo(() => computed(() => {
    if (!modelResultData) {
      return { columns: [], rows: [] };
    }

    const columnNames = ResultSetTools.getHeaders(modelResultData.data as SqlResultSet);
    const rowStrings = ResultSetTools.getLongestCells(modelResultData.data as SqlResultSet);

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
    const rows = (modelResultData.data as SqlResultSet).rows || [];

    const columns = (modelResultData.data as SqlResultSet).columns!.map<Column<any[], any>>((col, columnIndex) => ({
      key: columnIndex + '',
      name: col.label!,
      width: Math.min(300, measuredCells[columnIndex]),
      headerRenderer: TableColumnHeader,
    }));
    columns.unshift(indexColumn);

    return { rows, columns };
  }), [modelResultData]).get();

  const isIndexColumn = useCallback((columnKey: string) => columnKey === indexColumn.key, []);

  const isIndexColumnInRange = useCallback(
    (columnsRange: Array<Column<any[], any>>) => columnsRange.some(column => isIndexColumn(column.key)), [isIndexColumn]
  );

  const getColumnKeyFromColumnIndex = useCallback((columnIndex: number) => columns[columnIndex].key, [columns]);

  const getColumnsInRange = useCallback((startIndex: number, endIndex: number) => {
    if (startIndex === endIndex) {
      return [columns[startIndex]];
    }

    const firstIndex = Math.min(startIndex, endIndex);
    const lastIndex = Math.max(startIndex, endIndex);
    return columns.slice(firstIndex, lastIndex + 1);
  }, [columns]);

  return {
    columns, rows, getColumnsInRange, isIndexColumn, isIndexColumnInRange, getColumnKeyFromColumnIndex,
  };
}
