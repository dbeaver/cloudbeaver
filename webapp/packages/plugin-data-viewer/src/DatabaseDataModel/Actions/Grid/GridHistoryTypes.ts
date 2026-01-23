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
  CANCEL: 'grid-history-source-cancel',
} as const;

export interface IGridHistoryKeyWithValue<TKey extends IGridDataKey = IGridDataKey, TCell = unknown> {
  key: TKey;
  value?: TCell[];
}

export interface IGridHistoryKeyWithRowValue<TKey extends IGridDataKey = IGridDataKey, TCell = unknown> {
  key: TKey;
  rowValue?: TCell[];
}

export interface IGridHistoryCellUpdate<TKey extends IGridDataKey = IGridDataKey, TCell = unknown> {
  key: TKey;
  prevValue: TCell;
  value: TCell;
}

export interface IGridHistoryRowUpdate<TKey extends IGridDataKey = IGridDataKey, TCell = unknown> {
  key: TKey;
  prevValue: TCell[];
  value: TCell[];
}

export interface IGridHistoryEditCellData<TKey extends IGridDataKey = IGridDataKey, TCell = unknown> {
  key: TKey;
  value: TCell;
  prevValue: TCell;
}

export interface IGridHistoryAddRowData<TKey extends IGridDataKey = IGridDataKey, TCell = unknown> {
  keys: Array<IGridHistoryKeyWithValue<TKey, TCell>>;
}

export interface IGridHistoryDeleteRowData<TKey extends IGridDataKey = IGridDataKey, TCell = unknown> {
  keys: Array<IGridHistoryKeyWithValue<TKey, TCell>>;
}

export interface IGridHistoryRevertData<TKey extends IGridDataKey = IGridDataKey, TCell = unknown> {
  updates: Array<IGridHistoryCellUpdate<TKey, TCell>>;
  deletions: Array<IGridHistoryKeyWithValue<TKey, TCell>>;
  additions: Array<IGridHistoryKeyWithRowValue<TKey, TCell>>;
}

export interface IGridHistoryCancelData<TKey extends IGridDataKey = IGridDataKey, TCell = unknown> {
  updates: Array<IGridHistoryRowUpdate<TKey, TCell>>;
  deletions: Array<IGridHistoryKeyWithValue<TKey, TCell>>;
  additions: Array<IGridHistoryKeyWithRowValue<TKey, TCell>>;
}

export type IGridHistoryData<TKey extends IGridDataKey = IGridDataKey, TCell = unknown> =
  | IGridHistoryEditCellData<TKey, TCell>
  | IGridHistoryAddRowData<TKey, TCell>
  | IGridHistoryDeleteRowData<TKey, TCell>
  | IGridHistoryRevertData<TKey, TCell>
  | IGridHistoryCancelData<TKey, TCell>;

export function isGridHistoryEditCellData<TKey extends IGridDataKey = IGridDataKey, TCell = unknown>(
  entry: IHistoryEntry<unknown>,
): entry is IHistoryEntry<IGridHistoryEditCellData<TKey, TCell>> {
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

export function isGridHistoryCancelData<TKey extends IGridDataKey = IGridDataKey, TCell = unknown>(
  entry: IHistoryEntry<unknown>,
): entry is IHistoryEntry<IGridHistoryCancelData<TKey, TCell>> {
  return entry.source === GRID_HISTORY_SOURCE.CANCEL;
}
