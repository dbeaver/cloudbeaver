/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IGridDataKey } from './IGridDataKey.js';
import type { GridHistoryAction, IHistoryEntry } from './GridHistoryAction.js';
import { handleRedo, handleUndo, type IGridEditOperations } from './GridHistoryHandlers.js';
import {
  GRID_HISTORY_SOURCE,
  isGridHistoryEditCellData,
  type IGridHistoryCancelData,
  type IGridHistoryData,
  type IGridHistoryRevertData,
} from './GridHistoryTypes.js';
import { GridDataKeysUtils } from './GridDataKeysUtils.js';
import type { IGridUpdate } from './GridEditAction.js';

export class GridEditHistoryManager<TKey extends IGridDataKey, TCell> {
  private readonly history: GridHistoryAction<IGridHistoryData<TKey, TCell>, any>;

  constructor(history: GridHistoryAction<IGridHistoryData<TKey, TCell>, any>) {
    this.history = history;
  }

  setupHandlers(operations: IGridEditOperations<TKey, TCell>): void {
    this.history.onUndo.addHandler((entry: IHistoryEntry<unknown>) => {
      handleUndo(entry, operations);
    });
    this.history.onRedo.addHandler((entry: IHistoryEntry<unknown>) => {
      handleRedo(entry, operations);
    });
  }

  getCurrentEntry(): IHistoryEntry<IGridHistoryData<TKey, TCell>> | undefined {
    return this.history.getCurrentEntry();
  }

  getState(): readonly IHistoryEntry<IGridHistoryData<TKey, TCell>>[] {
    return this.history.getState();
  }

  clear(): void {
    this.history.clear();
  }

  recordCellEdit(key: TKey, value: TCell, prevValue: TCell): void {
    this.compressLastEditedCellHistory(key);

    this.history.add({
      source: GRID_HISTORY_SOURCE.EDIT_CELL,
      data: {
        key,
        value,
        prevValue,
      },
    });
  }

  recordAddRow(key: TKey, update: IGridUpdate<TCell> | undefined): void {
    this.compressLastEditedCellHistory();

    const value = update?.update;

    this.history.add({
      source: GRID_HISTORY_SOURCE.ADD_ROW,
      data: {
        key,
        value,
      },
    });
  }

  recordDeleteRow(key: TKey, update: IGridUpdate<TCell> | undefined, rowValue: TCell[] | undefined): void {
    this.compressLastEditedCellHistory();

    const value = update?.update || rowValue;

    this.history.add({
      source: GRID_HISTORY_SOURCE.DELETE_ROW,
      data: {
        key,
        value,
      },
    });
  }

  recordDuplicateRow(keys: Array<{ key: TKey; value?: TCell[] }>): void {
    this.compressLastEditedCellHistory();

    this.history.add({
      source: GRID_HISTORY_SOURCE.DUPLICATE_ROW,
      data: {
        keys,
      },
    });
  }

  recordRevert(data: IGridHistoryRevertData<TKey, TCell>): void {
    this.compressLastEditedCellHistory();

    this.history.add({
      source: GRID_HISTORY_SOURCE.REVERT,
      data,
    });
  }

  recordCancel(data: IGridHistoryCancelData<TKey, TCell>): void {
    this.compressLastEditedCellHistory();

    this.history.add({
      source: GRID_HISTORY_SOURCE.CANCEL,
      data,
    });
  }

  private compressLastEditedCellHistory(key?: TKey): void {
    const currentHistoryEntry = this.history.getCurrentEntry();

    if (!currentHistoryEntry || !isGridHistoryEditCellData<TKey, TCell>(currentHistoryEntry)) {
      return;
    }

    const isEditingSameCell = key && GridDataKeysUtils.isElementsKeyEqual(currentHistoryEntry.data.key, key);

    if (isEditingSameCell) {
      return;
    }

    this.compressCellEditHistory(currentHistoryEntry.data.key);
  }

  private compressCellEditHistory(key: TKey): void {
    this.history.compress(
      entry => isGridHistoryEditCellData<TKey, TCell>(entry) && GridDataKeysUtils.isElementsKeyEqual(entry.data.key, key),
      entries => {
        const firstEntry = entries[0]!;
        const lastEntry = entries[entries.length - 1]!;
        if (!isGridHistoryEditCellData<TKey, TCell>(firstEntry) || !isGridHistoryEditCellData<TKey, TCell>(lastEntry)) {
          throw new Error('Invalid history entry type');
        }
        return {
          source: GRID_HISTORY_SOURCE.EDIT_CELL,
          data: {
            key,
            value: lastEntry.data.value,
            prevValue: firstEntry.data.prevValue,
          },
        };
      },
      'lastSequence',
    );
  }

}
