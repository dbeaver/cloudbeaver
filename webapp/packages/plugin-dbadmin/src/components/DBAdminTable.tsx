/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useMemo } from 'react';

import { useTranslate } from '@cloudbeaver/core-blocks';
import {
  DataGrid,
  type ITableSelection,
  TableRowSelect,
  TableSelectionContext,
  useCellCopy,
  useCreateGridReactiveValue,
} from '@cloudbeaver/plugin-data-grid';

export interface IDBAdminTableColumn {
  id: string;
  displayName: string;
  description?: string | null;
}

export interface IDBAdminTableRow {
  id: string;
  values: Array<string | null | undefined>;
}

interface Props {
  columns: IDBAdminTableColumn[];
  rows: IDBAdminTableRow[];
  /** Adds a checkbox column for multi-row selection */
  selection?: ITableSelection;
  focusedRowId?: string | null;
  onRowFocus?: (rowId: string) => void;
  className?: string;
}

const SELECT_COLUMN_WIDTH = '40px';

export const DBAdminTable = observer<Props>(function DBAdminTable({ columns, rows, selection, focusedRowId, onRowFocus, className }) {
  const translate = useTranslate();
  const cellCopy = useCellCopy();
  const offset = selection ? 1 : 0;
  const selected = selection?.selected;

  const columnCount = useCreateGridReactiveValue(() => columns.length + offset, null, [columns, offset]);
  const rowCount = useCreateGridReactiveValue(() => rows.length, null, [rows]);
  const headerText = useCreateGridReactiveValue(
    colIdx => (colIdx < offset ? translate('ui_select_all') : (columns[colIdx - offset]?.displayName ?? '')),
    null,
    [columns, offset, translate],
  );

  const headerElement = useCreateGridReactiveValue(
    colIdx =>
      colIdx < offset ? (
        <TableRowSelect isRoot />
      ) : (
        <span title={columns[colIdx - offset]?.description ?? undefined}>{columns[colIdx - offset]?.displayName}</span>
      ),
    null,
    [columns, offset],
  );

  const cell = useCreateGridReactiveValue(
    (rowIdx, colIdx) => {
      const row = rows[rowIdx];

      if (!row) {
        return null;
      }

      if (colIdx < offset) {
        return <TableRowSelect id={row.id} />;
      }

      const value = row.values[colIdx - offset] ?? '';

      return <span title={value}>{value}</span>;
    },
    null,
    [rows, offset, selected],
  );

  const focusedRowIdx = useMemo(() => rows.findIndex(row => row.id === focusedRowId), [rows, focusedRowId]);

  const grid = (
    <DataGrid
      className={className}
      columnCount={columnCount}
      rowCount={rowCount}
      headerText={headerText}
      headerElement={headerElement}
      cell={cell}
      getRowId={rowIdx => rows[rowIdx]?.id ?? rowIdx}
      getRowClass={rowIdx => (rowIdx === focusedRowIdx ? 'tw:font-semibold' : null)}
      getHeaderWidth={colIdx => (colIdx < offset ? SELECT_COLUMN_WIDTH : 'auto')}
      getHeaderPinned={colIdx => colIdx < offset}
      getHeaderResizable={colIdx => colIdx >= offset}
      getRowHeight={() => 30}
      onFocus={position => {
        const row = rows[position.rowIdx];

        if (row) {
          onRowFocus?.(row.id);
        }
      }}
      onCellKeyDown={cellCopy.handleKeyDown}
    />
  );

  if (selection) {
    return <TableSelectionContext value={selection}>{grid}</TableSelectionContext>;
  }

  return grid;
});
