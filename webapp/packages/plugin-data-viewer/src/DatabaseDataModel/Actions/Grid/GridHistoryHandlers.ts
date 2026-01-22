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
  isGridHistoryCancelData,
  isGridHistoryDeleteRowData,
  isGridHistoryDuplicateRowData,
  isGridHistoryEditCellData,
  isGridHistoryRevertData,
} from './GridHistoryTypes.js';

export interface IGridEditOperations<TKey extends IGridDataKey, TCell> {
  setCell(key: TKey, value: TCell): void;
  setRow(key: TKey, value: TCell[]): void;
  addRow(row: TKey['row'], value: TCell[] | undefined, column: TKey['column']): void;
  deleteRow(row: TKey['row'], column: TKey['column']): void;
  revert(keys: TKey[]): void;
}

type HistoryHandler<TKey extends IGridDataKey, TCell> = (entry: IHistoryEntry<unknown>, operations: IGridEditOperations<TKey, TCell>) => void;

function createUndoHandlers<TKey extends IGridDataKey, TCell>(): Record<string, HistoryHandler<TKey, TCell>> {
  return {
    [GRID_HISTORY_SOURCE.EDIT_CELL]: (entry, ops) => {
      if (isGridHistoryEditCellData<TKey, TCell>(entry)) {
        ops.setCell(entry.data.key, entry.data.prevValue);
      }
    },
    [GRID_HISTORY_SOURCE.ADD_ROW]: (entry, ops) => {
      if (isGridHistoryAddRowData<TKey, TCell>(entry)) {
        ops.deleteRow(entry.data.key.row, entry.data.key.column);
      }
    },
    [GRID_HISTORY_SOURCE.DELETE_ROW]: (entry, ops) => {
      if (isGridHistoryDeleteRowData<TKey, TCell>(entry)) {
        ops.addRow(entry.data.key.row, entry.data.value, entry.data.key.column);
      }
    },
    [GRID_HISTORY_SOURCE.DUPLICATE_ROW]: (entry, ops) => {
      if (isGridHistoryDuplicateRowData<TKey, TCell>(entry)) {
        for (const { key } of entry.data.keys) {
          ops.deleteRow(key.row, key.column);
        }
      }
    },
    [GRID_HISTORY_SOURCE.REVERT]: (entry, ops) => {
      if (isGridHistoryRevertData<TKey, TCell>(entry)) {
        for (const { key, prevValue } of entry.data.updates) {
          ops.setCell(key, prevValue);
        }
        for (const { key } of entry.data.deletions) {
          ops.deleteRow(key.row, key.column);
        }
        for (const { key, rowValue } of entry.data.additions) {
          ops.addRow(key.row, rowValue, key.column);
        }
      }
    },
    [GRID_HISTORY_SOURCE.CANCEL]: (entry, ops) => {
      if (isGridHistoryCancelData<TKey, TCell>(entry)) {
        for (const { key, prevValue } of entry.data.updates) {
          ops.setRow(key, prevValue);
        }
        for (const { key } of entry.data.deletions) {
          ops.deleteRow(key.row, key.column);
        }
        for (const { key, rowValue } of entry.data.additions) {
          ops.addRow(key.row, rowValue, key.column);
        }
      }
    },
  };
}

function createRedoHandlers<TKey extends IGridDataKey, TCell>(): Record<string, HistoryHandler<TKey, TCell>> {
  return {
    [GRID_HISTORY_SOURCE.EDIT_CELL]: (entry, ops) => {
      if (isGridHistoryEditCellData<TKey, TCell>(entry)) {
        ops.setCell(entry.data.key, entry.data.value);
      }
    },
    [GRID_HISTORY_SOURCE.ADD_ROW]: (entry, ops) => {
      if (isGridHistoryAddRowData<TKey, TCell>(entry)) {
        ops.addRow(entry.data.key.row, entry.data.value, entry.data.key.column);
      }
    },
    [GRID_HISTORY_SOURCE.DELETE_ROW]: (entry, ops) => {
      if (isGridHistoryDeleteRowData<TKey, TCell>(entry)) {
        ops.deleteRow(entry.data.key.row, entry.data.key.column);
      }
    },
    [GRID_HISTORY_SOURCE.DUPLICATE_ROW]: (entry, ops) => {
      if (isGridHistoryDuplicateRowData<TKey, TCell>(entry)) {
        for (const { key, value } of entry.data.keys) {
          ops.addRow(key.row, value, key.column);
        }
      }
    },
    [GRID_HISTORY_SOURCE.REVERT]: (entry, ops) => {
      if (isGridHistoryRevertData<TKey, TCell>(entry)) {
        const allKeys: TKey[] = [
          ...entry.data.updates.map(({ key }) => key),
          ...entry.data.deletions.map(({ key }) => key),
          ...entry.data.additions.map(({ key }) => key),
        ];
        ops.revert(allKeys);
      }
    },
    [GRID_HISTORY_SOURCE.CANCEL]: (entry, ops) => {
      if (isGridHistoryCancelData<TKey, TCell>(entry)) {
        for (const { key, value } of entry.data.updates) {
          ops.setRow(key, value);
        }
        for (const { key } of entry.data.deletions) {
          ops.revert([key]);
        }
        for (const { key } of entry.data.additions) {
          ops.deleteRow(key.row, key.column);
        }
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
