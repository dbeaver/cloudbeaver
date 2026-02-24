/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IGridDataKey } from './IGridDataKey.js';
import type { GridHistoryAction, IHistoryEntry } from './GridHistoryAction.js';
import { handleGridEditHistoryRedo, handleGridEditHistoryUndo, type IGridEditOperations } from './GridHistoryHandlers.js';
import {
  GRID_HISTORY_SOURCE,
  isGridHistoryEditCellData,
  type IGridHistoryAddRowData,
  type IGridHistoryCellUpdateData,
  type IGridHistoryData,
  type IGridHistoryDeleteRowData,
  type IGridHistoryRevertData,
} from './GridHistoryTypes.js';
import { GridDataKeysUtils } from './GridDataKeysUtils.js';

export class GridEditHistoryManager<TKey extends IGridDataKey, TCell> {
  private readonly history: GridHistoryAction<IGridHistoryData<TKey, TCell>, any>;

  constructor(history: GridHistoryAction<IGridHistoryData<TKey, TCell>, any>) {
    this.history = history;
  }

  setupHandlers(operations: IGridEditOperations<TKey, TCell>): void {
    this.history.onUndo.addHandler((entry: IHistoryEntry<unknown>) => {
      handleGridEditHistoryUndo(entry, operations);
    });
    this.history.onRedo.addHandler((entry: IHistoryEntry<unknown>) => {
      handleGridEditHistoryRedo(entry, operations);
    });
  }

  recordCellEdit(data: IGridHistoryCellUpdateData<TKey, TCell>): void {
    // Pass the key to skip compression while the same cell is still being edited.
    // Without a key, compression always runs (e.g. for bulk edits).
    if (data.updates.length === 1) {
      this.compressLastEditedCellHistory(data.updates[0]!.key);
    } else {
      this.compressLastEditedCellHistory();
    }

    this.history.add({
      source: GRID_HISTORY_SOURCE.EDIT_CELL,
      data,
    });
  }

  recordAddRows(data: IGridHistoryAddRowData<TKey, TCell>): void {
    this.compressLastEditedCellHistory();

    this.history.add({
      source: GRID_HISTORY_SOURCE.ADD_ROW,
      data,
    });
  }

  recordDeleteRows(data: IGridHistoryDeleteRowData<TKey, TCell>): void {
    this.compressLastEditedCellHistory();

    this.history.add({
      source: GRID_HISTORY_SOURCE.DELETE_ROW,
      data,
    });
  }

  recordRevert(data: IGridHistoryRevertData<TKey, TCell>): void {
    this.compressLastEditedCellHistory();

    this.history.add({
      source: GRID_HISTORY_SOURCE.REVERT,
      data,
    });
  }

  private compressLastEditedCellHistory(key?: TKey): void {
    const currentHistoryEntry = this.history.getCurrentEntry();

    if (!currentHistoryEntry || !isGridHistoryEditCellData<TKey, TCell>(currentHistoryEntry)) {
      return;
    }

    const currentUpdate = currentHistoryEntry.data.updates.length === 1 ? currentHistoryEntry.data.updates[0] : undefined;

    if (!currentUpdate) {
      return;
    }

    const isEditingSameCell = key && GridDataKeysUtils.isElementsKeyEqual(currentUpdate.key, key);

    if (isEditingSameCell) {
      return;
    }

    this.compressCellEditHistory(currentUpdate.key);
  }

  private compressCellEditHistory(key: TKey): void {
    this.history.compress(
      entry =>
        isGridHistoryEditCellData<TKey, TCell>(entry) &&
        entry.data.updates.length === 1 &&
        GridDataKeysUtils.isElementsKeyEqual(entry.data.updates[0]!.key, key),
      entries => {
        const firstEntry = entries[0]! as IHistoryEntry<IGridHistoryCellUpdateData<TKey, TCell>>;
        const lastEntry = entries[entries.length - 1]! as IHistoryEntry<IGridHistoryCellUpdateData<TKey, TCell>>;

        return {
          source: GRID_HISTORY_SOURCE.EDIT_CELL,
          data: {
            updates: [
              {
                key,
                value: lastEntry.data.updates[0]!.value,
                prevValue: firstEntry.data.updates[0]!.prevValue,
              },
            ],
          },
        };
      },
      'lastSequence',
    );
  }
}
