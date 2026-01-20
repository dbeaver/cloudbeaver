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
  DUPLICATE_ROW: 'grid-history-source-duplicate-row',
  REVERT: 'grid-history-source-revert',
  CANCEL: 'grid-history-source-cancel',
} as const;

export interface IGridHistoryEditCellData<TKey extends IGridDataKey = IGridDataKey, TCell = unknown> {
  key: TKey;
  value: TCell;
  prevValue: TCell;
}

export interface IGridHistoryAddRowData<TKey extends IGridDataKey = IGridDataKey, TCell = unknown> {
  key: TKey;
  value?: TCell[];
}

export interface IGridHistoryDeleteRowData<TKey extends IGridDataKey = IGridDataKey, TCell = unknown> {
  key: TKey;
  value?: TCell[];
}

export interface IGridHistoryDuplicateRowData<TKey extends IGridDataKey = IGridDataKey, TCell = unknown> {
  keys: Array<{ key: TKey; value?: TCell[] }>;
}

export interface IGridHistoryRevertData<TKey extends IGridDataKey = IGridDataKey, TCell = unknown> {
  updates: Array<{ key: TKey; prevValue: TCell; value: TCell }>;
  deletions: Array<{ key: TKey; value?: TCell[] }>;
  additions: Array<{ key: TKey; rowValue?: TCell[] }>;
}

export interface IGridHistoryCancelData<TKey extends IGridDataKey = IGridDataKey, TCell = unknown> {
  updates: Array<{ key: TKey; prevValue: TCell[]; value: TCell[] }>;
  deletions: Array<{ key: TKey; value?: TCell[] }>;
  additions: Array<{ key: TKey; rowValue?: TCell[] }>;
}

export type IGridHistoryData<TKey extends IGridDataKey = IGridDataKey, TCell = unknown> =
  | IGridHistoryEditCellData<TKey, TCell>
  | IGridHistoryAddRowData<TKey, TCell>
  | IGridHistoryDeleteRowData<TKey, TCell>
  | IGridHistoryDuplicateRowData<TKey, TCell>
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

export function isGridHistoryDuplicateRowData<TKey extends IGridDataKey = IGridDataKey, TCell = unknown>(
  entry: IHistoryEntry<unknown>,
): entry is IHistoryEntry<IGridHistoryDuplicateRowData<TKey, TCell>> {
  return entry.source === GRID_HISTORY_SOURCE.DUPLICATE_ROW;
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
