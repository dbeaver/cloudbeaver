/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { DataGridCellKeyboardEvent, ICellPosition } from '@dbeaver/react-data-grid';

interface IColumn {
  key: string;
}

interface IAdministrationTableOpenOptions<T> {
  rows: T[];
  columns: IColumn[];
  openColumnKey: string;
  open: (row: T) => void;
}

/**
 * Handles the `onCellKeyDown` event for administration tables that open an options panel.
 * Press Enter on the trigger column to open the panel for the focused row.
 * Calls `event.preventDefault()` to prevent the grid from triggering a navigation event
 * that would close the panel immediately.
 *
 * @example
 * onCellKeyDown={(position, event) =>
 *   onCellKeyDownTableOpen(position, event, { rows, columns: COLUMNS, openColumnKey: ID_COLUMN.key, open: row => service.open(row.id) })
 * }
 */
export function onCellKeyDownTableOpen<T>(
  position: ICellPosition,
  event: DataGridCellKeyboardEvent,
  { rows, columns, openColumnKey, open }: IAdministrationTableOpenOptions<T>,
): void {
  const row = rows[position.rowIdx];

  if (event.key === 'Enter' && columns[position.colIdx]?.key === openColumnKey && row) {
    event.preventDefault();
    open(row);
  }
}
