/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed, observable } from 'mobx';
import { useRef, useState } from 'react';

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
import type { ITableData, ITableState } from './TableDataContext';

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
const COLUMNS_PER_CHUNK = 10;
const MIN_COLUMN_WIDTH = 300;

const FONT = '400 12px Roboto';

export function useTableData(
  model: IDatabaseDataModel<any, IDatabaseResultSet>,
  resultIndex: number,
  gridDIVElement: React.RefObject<HTMLDivElement | null>,
): [ITableData, ITableState] {
  const format = model.source.getAction(resultIndex, ResultSetFormatAction);
  const data = model.source.getAction(resultIndex, ResultSetDataAction);
  const editor = model.source.getAction(resultIndex, ResultSetEditAction);
  const view = model.source.getAction(resultIndex, ResultSetViewAction);
  const dataContent = model.source.getAction(resultIndex, ResultSetDataContentAction);
  const constraints = model.source.getAction(resultIndex, ResultSetConstraintAction);
  const columnsRef = useRef<Column<IResultSetRowKey, any>[]>([]);
  const timers = useRef<(NodeJS.Timeout | null)[]>([]);

  const scheduleColumnsUpdate = (currentChunk = 0) => {
    const totalChunksAmount = Math.ceil(format.getHeaders().length / COLUMNS_PER_CHUNK);
    const columnNames = format.getHeaders();
    const start = currentChunk * COLUMNS_PER_CHUNK;
    const end = Math.min(COLUMNS_PER_CHUNK + start, columnNames.length);
    const rowStrings = format.getLongestCells(start, end);

    const prevTimer = timers.current?.[currentChunk - 1];

    if (prevTimer) {
      clearTimeout(prevTimer);
      timers.current[currentChunk - 1] = null;
    }

    const { columnsWidth, cellsWidth } = getWidths(rowStrings);

    const newColumns = columnsRef.current.map((column, index) => {
      if (index < start || index >= end) {
        return column;
      }

      return {
        ...column,
        width: Math.min(MIN_COLUMN_WIDTH, Math.max(columnsWidth[index], cellsWidth[index] ?? 0));,
      };
    });

    columnsRef.current = newColumns;
    setColumns(newColumns);

    if (currentChunk < totalChunksAmount - 1) {
      setTimeout(() => scheduleColumnsUpdate(currentChunk + 1), 0);
    }
  };

  const getWidths = (rowStrings: string[]) => {
    const columnNames = format.getHeaders();

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

    return {
      columnsWidth,
      cellsWidth,
    };
  };

  const getColumns = () => {
    if (ref.columnKeys.length === 0) {
      return [];
    }

    const columnNames = format.getHeaders();
    const columnsToProcess = Math.min(COLUMNS_PER_CHUNK, columnNames.length);
    const rowStrings = format.getLongestCells(0, columnsToProcess);

    const { columnsWidth, cellsWidth } = getWidths(rowStrings);

    const newColumns: Array<Column<IResultSetRowKey, any>> = ref.columnKeys.map<Column<IResultSetRowKey, any>>((col, index) => ({
      key: ResultSetDataKeysUtils.serialize(col),
      columnDataIndex: col,
      name: ref.getColumnInfo(col)?.label || '?',
      editable: true,
      width: Math.min(MIN_COLUMN_WIDTH, Math.max(columnsWidth[index], cellsWidth[index] ?? 0)),
      renderHeaderCell: props => <TableColumnHeader {...props} />,
    }));
    newColumns.unshift(indexColumn);

    columnsRef.current = newColumns;

    if (ref.columnKeys.length > COLUMNS_PER_CHUNK) {
      timers.current[0] = setTimeout(() => {
        scheduleColumnsUpdate(1);

        if (timers.current[0]) {
          clearTimeout(timers.current[0]);
          timers.current[0] = null;
        }
      }, 1);
    }

    return newColumns;
  };

  const ref = useObservableRef<ITableData & { gridDIVElement: React.RefObject<HTMLDivElement | null> }>(
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
      getMetrics(columnIndex) {
        if (columnIndex < 0 || columnIndex > columns.length) {
          return undefined;
        }

        let left = 0;
        for (let i = 0; i < columnIndex; i++) {
          const column = columns[i];
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
        return columns[columnIndex];
      },
      getColumnByDataIndex(key) {
        return columns.find(column => column.columnDataIndex !== null && ResultSetDataKeysUtils.isEqual(column.columnDataIndex, key))!;
      },
      getColumnInfo(key) {
        return this.data.getColumn(key);
      },
      getCellValue(key) {
        return this.view.getCellValue(key);
      },
      getColumnIndexFromKey(key) {
        return columns.findIndex(column => column.key === key);
      },
      getColumnIndexFromColumnKey(columnKey) {
        return columns.findIndex(column => column.columnDataIndex !== null && ResultSetDataKeysUtils.isEqual(columnKey, column.columnDataIndex));
      },
      getRowIndexFromKey(rowKey) {
        return this.rows.findIndex(row => ResultSetDataKeysUtils.isEqual(rowKey, row));
      },
      getColumnsInRange(startIndex, endIndex) {
        if (startIndex === endIndex) {
          return [columns[startIndex]];
        }

        const firstIndex = Math.min(startIndex, endIndex);
        const lastIndex = Math.max(startIndex, endIndex);
        return columns.slice(firstIndex, lastIndex + 1);
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

  const [columns, setColumns] = useState<Column<IResultSetRowKey, any>[]>(getColumns());

  return [ref, {
    columns
  }];
}
