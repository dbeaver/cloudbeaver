/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IHistoryEntry } from './GridHistoryAction.js';
import type { IGridDataKey } from './IGridDataKey.js';
import {
  GRID_HISTORY_SOURCE,
  isGridHistoryAddRowData,
  isGridHistoryDeleteRowData,
  isGridHistoryEditCellData,
  isGridHistoryRevertData,
} from './GridHistoryTypes.js';

export interface IGridEditOperations<TKey extends IGridDataKey, TCell> {
  setCells(cells: Array<{ key: TKey; value: TCell }>): void;
  setRows(rows: Array<{ key: TKey; value: TCell[] }>): void;
  addRows(rows: Array<{ row: TKey['row']; value: TCell[] | undefined; column: TKey['column'] }>): void;
  deleteRows(rows: Array<{ row: TKey['row']; column: TKey['column'] }>): void;
  revertChanges(rows: Array<{ row: TKey['row'] }>): void;
}

type HistoryHandler<TKey extends IGridDataKey, TCell> = (entry: IHistoryEntry<unknown>, operations: IGridEditOperations<TKey, TCell>) => void;

function createUndoHandlers<TKey extends IGridDataKey, TCell>(): Record<string, HistoryHandler<TKey, TCell>> {
  return {
    [GRID_HISTORY_SOURCE.EDIT_CELL]: (entry, ops) => {
      if (isGridHistoryEditCellData<TKey, TCell>(entry)) {
        ops.setCells([
          {
            key: entry.data.key,
            value: entry.data.prevValue,
          },
        ]);
      }
    },
    [GRID_HISTORY_SOURCE.ADD_ROW]: (entry, ops) => {
      if (isGridHistoryAddRowData<TKey, TCell>(entry)) {
        ops.deleteRows(entry.data.rowEntries.map(({ key }) => ({ row: key.row, column: key.column })));
      }
    },
    [GRID_HISTORY_SOURCE.DELETE_ROW]: (entry, ops) => {
      if (isGridHistoryDeleteRowData<TKey, TCell>(entry)) {
        for (const rowEntry of entry.data.rowEntries) {
          const isNewlyAddedRow = rowEntry.key.row.subIndex !== 0;

          if (isNewlyAddedRow) {
            ops.addRows([{ row: rowEntry.key.row, value: rowEntry.value, column: rowEntry.key.column }]);
          } else {
            ops.revertChanges([{ row: rowEntry.key.row }]);
          }
        }
      }
    },
    [GRID_HISTORY_SOURCE.REVERT]: (entry, ops) => {
      if (isGridHistoryRevertData<TKey, TCell>(entry)) {
        ops.setRows(entry.data.updates.map(({ key, prevValue }) => ({ key, value: prevValue })));
        ops.deleteRows(entry.data.deletions.map(({ key }) => key));
        ops.addRows(entry.data.additions.map(({ key, value }) => ({ ...key, value })));
      }
    },
  };
}

function createRedoHandlers<TKey extends IGridDataKey, TCell>(): Record<string, HistoryHandler<TKey, TCell>> {
  return {
    [GRID_HISTORY_SOURCE.EDIT_CELL]: (entry, ops) => {
      if (isGridHistoryEditCellData<TKey, TCell>(entry)) {
        ops.setCells([
          {
            key: entry.data.key,
            value: entry.data.value,
          },
        ]);
      }
    },
    [GRID_HISTORY_SOURCE.ADD_ROW]: (entry, ops) => {
      if (isGridHistoryAddRowData<TKey, TCell>(entry)) {
        ops.addRows(entry.data.rowEntries.map(({ key, value }) => ({ row: key.row, value, column: key.column })));
      }
    },
    [GRID_HISTORY_SOURCE.DELETE_ROW]: (entry, ops) => {
      if (isGridHistoryDeleteRowData<TKey, TCell>(entry)) {
        ops.deleteRows(entry.data.rowEntries.map(({ key }) => ({ row: key.row, column: key.column })));
      }
    },
    [GRID_HISTORY_SOURCE.REVERT]: (entry, ops) => {
      if (isGridHistoryRevertData<TKey, TCell>(entry)) {
        ops.setRows(entry.data.updates.map(({ key, value }) => ({ key, value })));
        ops.revertChanges(entry.data.deletions.map(({ key }) => ({ row: key.row })));
        ops.deleteRows(entry.data.additions.map(({ key }) => ({ row: key.row, column: key.column })));
      }
    },
  };
}

export function handleGridEditHistoryUndo<TKey extends IGridDataKey, TCell>(
  entry: IHistoryEntry<unknown>,
  operations: IGridEditOperations<TKey, TCell>,
): void {
  const handlers = createUndoHandlers<TKey, TCell>();
  handlers[entry.source]?.(entry, operations);
}

export function handleGridEditHistoryRedo<TKey extends IGridDataKey, TCell>(
  entry: IHistoryEntry<unknown>,
  operations: IGridEditOperations<TKey, TCell>,
): void {
  const handlers = createRedoHandlers<TKey, TCell>();
  handlers[entry.source]?.(entry, operations);
}
