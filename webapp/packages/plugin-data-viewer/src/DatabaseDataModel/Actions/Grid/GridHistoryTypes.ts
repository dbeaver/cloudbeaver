/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IGridDataKey } from './IGridDataKey.js';
import type { IHistoryEntry } from './GridHistoryAction.js';

export const GRID_HISTORY_SOURCE = {
  EDIT_CELL: 'grid-history-source-edit-cell',
  ADD_ROW: 'grid-history-source-add-row',
  DELETE_ROW: 'grid-history-source-delete-row',
  REVERT: 'grid-history-source-revert',
} as const;

export interface IGridHistoryRow<TKey extends IGridDataKey = IGridDataKey, TCell = unknown> {
  key: TKey;
  value: TCell[];
}

export interface IGridHistoryCellUpdateData<TKey extends IGridDataKey = IGridDataKey, TCell = unknown> {
  key: TKey;
  prevValue: TCell;
  value: TCell;
}

export interface IGridHistoryRowUpdate<TKey extends IGridDataKey = IGridDataKey, TCell = unknown> extends IGridHistoryRow<TKey, TCell> {
  prevValue: TCell[];
}

export interface IGridHistoryAddRowData<TKey extends IGridDataKey = IGridDataKey, TCell = unknown> {
  rowEntries: Array<IGridHistoryRow<TKey, TCell>>;
}

export interface IGridHistoryDeleteRowData<TKey extends IGridDataKey = IGridDataKey, TCell = unknown> {
  rowEntries: Array<IGridHistoryRow<TKey, TCell>>;
}

export interface IGridHistoryRevertData<TKey extends IGridDataKey = IGridDataKey, TCell = unknown> {
  updates: Array<IGridHistoryRowUpdate<TKey, TCell>>;
  deletions: Array<IGridHistoryRow<TKey, TCell>>;
  additions: Array<IGridHistoryRow<TKey, TCell>>;
}

export type IGridHistoryData<TKey extends IGridDataKey = IGridDataKey, TCell = unknown> =
  | IGridHistoryCellUpdateData<TKey, TCell>
  | IGridHistoryAddRowData<TKey, TCell>
  | IGridHistoryDeleteRowData<TKey, TCell>
  | IGridHistoryRevertData<TKey, TCell>;

export function isGridHistoryEditCellData<TKey extends IGridDataKey = IGridDataKey, TCell = unknown>(
  entry: IHistoryEntry<unknown>,
): entry is IHistoryEntry<IGridHistoryCellUpdateData<TKey, TCell>> {
  return entry.source === GRID_HISTORY_SOURCE.EDIT_CELL;
}

export function isGridHistoryAddRowData<TKey extends IGridDataKey = IGridDataKey, TCell = unknown>(
  entry: IHistoryEntry<unknown>,
): entry is IHistoryEntry<IGridHistoryAddRowData<TKey, TCell>> {
  return entry.source === GRID_HISTORY_SOURCE.ADD_ROW;
}

export function isGridHistoryDeleteRowData<TKey extends IGridDataKey = IGridDataKey, TCell = unknown>(
  entry: IHistoryEntry<unknown>,
): entry is IHistoryEntry<IGridHistoryDeleteRowData<TKey, TCell>> {
  return entry.source === GRID_HISTORY_SOURCE.DELETE_ROW;
}

export function isGridHistoryRevertData<TKey extends IGridDataKey = IGridDataKey, TCell = unknown>(
  entry: IHistoryEntry<unknown>,
): entry is IHistoryEntry<IGridHistoryRevertData<TKey, TCell>> {
  return entry.source === GRID_HISTORY_SOURCE.REVERT;
}
