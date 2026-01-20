/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, makeObservable, observable } from 'mobx';

import { IDatabaseDataSource } from '../../IDatabaseDataSource.js';
import { DatabaseEditAction } from '../DatabaseEditAction.js';
import {
  DatabaseEditChangeType,
  type IDatabaseDataEditActionData,
  type IDatabaseDataEditActionValue,
  type IDatabaseDataEditApplyActionData,
  type IDatabaseDataEditApplyActionUpdate,
} from '../IDatabaseDataEditAction.js';
import { GridDataResultAction } from './GridDataResultAction.js';
import { IDatabaseDataResult } from '../../IDatabaseDataResult.js';
import type { IGridColumnKey, IGridDataKey, IGridRowKey } from './IGridDataKey.js';
import { GridDataKeysUtils } from './GridDataKeysUtils.js';
import { compareGridRowKeys } from './compareGridRowKeys.js';
import { injectable } from '@cloudbeaver/core-di';
import { IDatabaseDataResultAction } from '../IDatabaseDataResultAction.js';
import { GridHistoryAction, type IHistoryEntry } from './GridHistoryAction.js';

export interface IGridUpdate<TCell> {
  row: IGridRowKey;
  type: DatabaseEditChangeType;
  update: TCell[];
  source?: TCell[];
}

export interface IGridEditApplyActionUpdate extends IDatabaseDataEditApplyActionUpdate {
  type?: DatabaseEditChangeType;
  row: IGridRowKey;
  newRow: IGridRowKey;
}

export interface IGridEditApplyActionData extends IDatabaseDataEditApplyActionData {
  resultId: string | null;
  updates: Array<IGridEditApplyActionUpdate>;
}

export type IGridEditActionData<TKey extends IGridDataKey = IGridDataKey, TCell = unknown> = IDatabaseDataEditActionData<TKey, TCell>;

type IGridHistoryEditCellData<TKey extends IGridDataKey = IGridDataKey, TCell = unknown> = {
  key: TKey;
  value: TCell;
  prevValue: TCell;
};

type IGridHistoryAddRowData<TKey extends IGridDataKey = IGridDataKey, TCell = unknown> = {
  key: TKey;
  value?: TCell[];
};

type IGridHistoryData<TKey extends IGridDataKey = IGridDataKey, TCell = unknown> =
  IGridHistoryEditCellData<TKey, TCell>
  | IGridHistoryAddRowData<TKey, TCell>;

const GRID_HISTORY_SOURCE_EDIT_CELL = 'grid-history-source-edit-cell';
const GRID_HISTORY_SOURCE_ADD_ROW = 'grid-history-source-add-row';

function isGridHistoryEditCellData<TKey extends IGridDataKey = IGridDataKey, TCell = unknown>(
  data: IHistoryEntry<unknown>
): data is IHistoryEntry<IGridHistoryEditCellData<TKey, TCell>> {
  return data.source === GRID_HISTORY_SOURCE_EDIT_CELL;
}

function isGridHistoryAddRowData<TKey extends IGridDataKey = IGridDataKey, TCell = unknown>(
  data: IHistoryEntry<unknown>
): data is IHistoryEntry<IGridHistoryAddRowData<TKey, TCell>> {
  return data.source === GRID_HISTORY_SOURCE_ADD_ROW;
}

@injectable(() => [IDatabaseDataSource, IDatabaseDataResult, IDatabaseDataResultAction, GridHistoryAction])
export class GridEditAction<
  TColumn = unknown,
  TRow = unknown,
  TKey extends IGridDataKey = IGridDataKey,
  TCell = unknown,
  TResult extends IDatabaseDataResult = IDatabaseDataResult,
> extends DatabaseEditAction<TKey, TCell, IGridEditApplyActionData, TResult> {
  protected readonly editorData: Map<string, IGridUpdate<TCell>>;
  protected readonly data: GridDataResultAction<TColumn, TRow, TKey, TCell, TResult>;
  protected readonly history: GridHistoryAction<IGridHistoryData<TKey, TCell>, TResult>;

  constructor(
    source: IDatabaseDataSource<any, TResult>,
    result: TResult,
    data: IDatabaseDataResultAction<TKey, TResult>,
    history: GridHistoryAction<any, TResult>,
  ) {
    super(source, result);
    this.editorData = new Map();
    this.data = data as GridDataResultAction<TColumn, TRow, TKey, TCell, TResult>;
    this.history = history as GridHistoryAction<IGridHistoryData<TKey, TCell>, TResult>;

    this.history.onUndo.addHandler(this.handleUndo.bind(this));
    this.history.onRedo.addHandler(this.handleRedo.bind(this));

    makeObservable<this, 'editorData'>(this, {
      editorData: observable,
      set: action,
      add: action,
      addRow: action,
      delete: action,
      deleteRow: action,
      revert: action,
      applyUpdate: action,
      applyPartialUpdate: action,
    });
  }

  get addRows(): IGridRowKey[] {
    return Array.from(this.editorData.values())
      .filter(update => update.type === DatabaseEditChangeType.add)
      .map(update => update.row);
  }

  get updates(): IGridUpdate<TCell>[] {
    return Array.from(this.editorData.values()).sort((a, b) => {
      if (a.type !== b.type) {
        return a.type - b.type;
      }

      return a.row.index - b.row.index;
    });
  }

  isEdited(): boolean {
    return this.editorData.size > 0;
  }

  isElementEdited(key: TKey): boolean {
    const update = this.editorData.get(GridDataKeysUtils.serialize(key.row));

    if (!update) {
      return false;
    }

    if (update.source === undefined || update.type === DatabaseEditChangeType.delete) {
      return true;
    }

    return !this.compareCellValue(update.source[key.column.index], update.update[key.column.index]);
  }

  isRowEdited(key: IGridRowKey): boolean {
    const update = this.editorData.get(GridDataKeysUtils.serialize(key));

    if (!update) {
      return false;
    }

    return true;
  }

  getElementState(key: TKey): DatabaseEditChangeType | null {
    const update = this.editorData.get(GridDataKeysUtils.serialize(key.row));

    if (!update) {
      return null;
    }

    if (update.source === undefined || update.type !== DatabaseEditChangeType.update) {
      return update.type;
    }

    if (!this.compareCellValue(update.source[key.column.index], update.update[key.column.index])) {
      return update.type;
    }

    return null;
  }

  get(key: TKey): TCell | undefined {
    return this.editorData.get(GridDataKeysUtils.serialize(key.row))?.update[key.column.index];
  }

  getRow(key: IGridRowKey): TCell[] | undefined {
    return this.editorData.get(GridDataKeysUtils.serialize(key))?.update;
  }

  set(key: TKey, value: TCell): void {
    this.setCellValue(key, value);
    this.updateHistoryWithCellValue(key, value);
  }

  private setCellValue(key: TKey, value: TCell): void {
    const [update] = this.getOrCreateUpdate(key.row, DatabaseEditChangeType.update);
    const prevValue = update.source?.[key.column.index] as any;

    update.update[key.column.index] = value;

    this.action.execute({
      resultId: this.result.id,
      type: update.type,
      revert: false,
      value: [
        {
          key,
          prevValue,
          value,
        },
      ],
    });

    this.removeEmptyUpdate(update);
  }

  add(key?: TKey): void {
    this.addRow(key?.row, undefined, key?.column);
  }

  addRow(row?: IGridRowKey, value?: TCell[], column?: IGridColumnKey, skipHistory?: boolean): void {
    if (!row) {
      row = this.data.getDefaultKey().row;
    }

    if (value === undefined) {
      value = this.data.columns.map(() => null) as TCell[];
    }

    if (!skipHistory) {
      row = this.getNextRowAdd(row);
    }

    if (!column) {
      column = this.data.getDefaultKey().column;
    }

    const [update, created] = this.getOrCreateUpdate(row, DatabaseEditChangeType.add, value);

    if (created) {
      this.action.execute({
        resultId: this.result.id,
        type: update.type,
        revert: false,
        value: [
          {
            key: { column, row } as TKey,
          },
        ],
      });

      if (!skipHistory) {
        this.updateHistoryWithAddRow({ column, row } as TKey);
      }
    }
  }

  duplicate(...keys: TKey[]): void {
    const result: TKey[] = [];
    const rowKeys = new Set<string>();

    for (const key of keys) {
      const serialized = GridDataKeysUtils.serialize(key.row);

      if (!rowKeys.has(serialized)) {
        result.push(key);
        rowKeys.add(serialized);
      }
    }

    this.duplicateRow(...result);
  }

  duplicateRow(...keys: TKey[]): void {
    for (const key of keys) {
      let value = this.data.getRowValue(key.row);

      const editedValue = this.editorData.get(GridDataKeysUtils.serialize(key.row));

      if (editedValue) {
        value = editedValue.update;
      }

      this.addRow(key.row, JSON.parse(JSON.stringify(value)), key.column);
    }
  }

  delete(...keys: TKey[]): void {
    const reverted: Array<IDatabaseDataEditActionValue<TKey, TCell>> = [];
    const deleted: Array<IDatabaseDataEditActionValue<TKey, TCell>> = [];

    for (const key of keys) {
      const serializedKey = GridDataKeysUtils.serialize(key.row);
      const update = this.editorData.get(serializedKey);

      if (update?.type === DatabaseEditChangeType.add) {
        reverted.push({ key });
        this.editorData.delete(serializedKey);
      } else {
        this.deleteRow(key.row, key.column, true);
        deleted.push({ key });
      }
    }

    if (reverted.length > 0) {
      this.action.execute({
        resultId: this.result.id,
        type: DatabaseEditChangeType.add,
        revert: true,
        value: reverted,
      });
    }

    if (deleted.length > 0) {
      this.action.execute({
        resultId: this.result.id,
        type: DatabaseEditChangeType.delete,
        revert: false,
        value: deleted,
      });
    }
  }

  deleteRow(key: IGridRowKey, column?: IGridColumnKey, silent?: boolean): void {
    const serializedKey = GridDataKeysUtils.serialize(key);
    const update = this.editorData.get(serializedKey);

    if (key.subIndex !== 0 && !update) {
      return;
    }

    if (update && update.type !== DatabaseEditChangeType.delete) {
      this.editorData.delete(serializedKey);
    }

    if (!column) {
      column = this.data.getDefaultKey().column;
    }

    if (update?.type !== DatabaseEditChangeType.add) {
      const [update, created] = this.getOrCreateUpdate(key, DatabaseEditChangeType.delete);

      if (created && !silent) {
        this.action.execute({
          resultId: this.result.id,
          type: update.type,
          revert: false,
          value: [
            {
              key: { column, row: key } as TKey,
            },
          ],
        });
      }
    } else if (!silent) {
      this.action.execute({
        resultId: this.result.id,
        type: update.type,
        revert: true,
        value: [
          {
            key: { column, row: key } as TKey,
          },
        ],
      });
    }
  }

  applyPartialUpdate(resultId: string | null, rows: TCell[][]): void {
    if (rows.length !== this.updates.length) {
      console.warn('GridEditAction: returned data differs from performed update');
    }

    const applyUpdate: Array<IGridEditApplyActionUpdate> = [];

    const tempUpdates = this.updates
      .map((update, i) => ({
        rowIndex: update.type === DatabaseEditChangeType.delete ? -1 : i,
        update,
      }))
      .sort((a, b) => compareGridRowKeys(b.update.row, a.update.row));

    let offset = tempUpdates.reduce((offset, { update }) => {
      if (update.type === DatabaseEditChangeType.add) {
        return offset + 1;
      }
      if (update.type === DatabaseEditChangeType.delete) {
        return offset - 1;
      }
      return offset;
    }, 0);

    for (const update of tempUpdates) {
      const value = rows?.[update.rowIndex];
      const row = update.update.row;
      const type = update.update.type;

      switch (update.update.type) {
        case DatabaseEditChangeType.update: {
          if (value) {
            this.data.setRowValue(update.update.row, value);
          }
          this.applyResultToUpdate(update.update, value);
          this.shiftRow(update.update.row, offset);
          this.removeEmptyUpdate(update.update);
          break;
        }

        case DatabaseEditChangeType.add: {
          if (value) {
            this.data.insertRow(update.update.row, value, 1);
          }
          this.applyResultToUpdate(update.update, value);
          this.shiftRow(update.update.row, offset);
          this.removeEmptyUpdate(update.update);
          offset--;
          break;
        }

        case DatabaseEditChangeType.delete: {
          this.revert({ row: update.update.row, column: { index: 0 } } as TKey);
          this.data.removeRow(update.update.row);
          offset++;
          break;
        }
      }

      applyUpdate.push({
        type,
        row,
        newRow: update.update.row,
      });
    }

    if (applyUpdate.length > 0) {
      this.applyAction.execute({
        resultId: resultId,
        updates: applyUpdate,
      });
    }
  }

  applyUpdate(resultId: string | null, rows: TCell[][]): void {
    this.applyPartialUpdate(resultId, rows);

    this.clear();
  }

  revert(...keys: TKey[]): void {
    const revertedUpdates: Array<IDatabaseDataEditActionValue<TKey, TCell>> = [];
    const revertedDeletions: Array<IDatabaseDataEditActionValue<TKey, TCell>> = [];
    const revertedAdditions: Array<IDatabaseDataEditActionValue<TKey, TCell>> = [];

    for (const key of keys) {
      const row = GridDataKeysUtils.serialize(key.row);
      const update = this.editorData.get(row);

      if (!update) {
        continue;
      }

      let prevValue: TCell | undefined;
      let value: TCell | undefined;

      if (update.type === DatabaseEditChangeType.delete) {
        revertedDeletions.push({ key });
        this.editorData.delete(row);
      } else {
        prevValue = update.update[key.column.index];
        value = update.source?.[key.column.index] ?? (null as TCell);
        update.update[key.column.index] = value;

        if (update.type === DatabaseEditChangeType.add) {
          revertedAdditions.push({ key, prevValue, value });
        } else {
          revertedUpdates.push({ key, prevValue, value });
        }
      }

      this.removeEmptyUpdate(update);
    }

    if (revertedUpdates.length > 0) {
      this.action.execute({
        resultId: this.result.id,
        type: DatabaseEditChangeType.update,
        revert: true,
        value: revertedUpdates,
      });
    }

    if (revertedDeletions.length > 0) {
      this.action.execute({
        resultId: this.result.id,
        type: DatabaseEditChangeType.delete,
        revert: true,
        value: revertedDeletions,
      });
    }

    if (revertedAdditions.length > 0) {
      this.action.execute({
        resultId: this.result.id,
        type: DatabaseEditChangeType.add,
        revert: true,
        value: revertedAdditions,
      });
    }
  }

  clear(): void {
    this.editorData.clear();

    this.action.execute({
      resultId: this.result.id,
      revert: true,
    });
  }

  private getNextRowAdd(row: IGridRowKey): IGridRowKey {
    let i = row.subIndex + 1;
    while (this.editorData.has(GridDataKeysUtils.serialize({ ...row, subIndex: i }))) {
      i++;
    }

    return { ...row, subIndex: i };
  }

  private shiftRow(row: IGridRowKey, shift: number) {
    const key = GridDataKeysUtils.serialize(row);
    const update = this.editorData.get(GridDataKeysUtils.serialize(row));

    if (update) {
      update.row = {
        index: update.row.index + shift,
        subIndex: 0,
      };
      this.editorData.delete(key);
      this.editorData.set(GridDataKeysUtils.serialize(update.row), update);
    }
  }

  private removeEmptyUpdate(update: IGridUpdate<TCell>) {
    if (update.type === DatabaseEditChangeType.add) {
      return;
    }

    if (update.source && !update.source.some((value, i) => !this.compareCellValue(value, update.update[i]))) {
      this.editorData.delete(GridDataKeysUtils.serialize(update.row));
    }
  }

  protected getOrCreateUpdate(row: IGridRowKey, type: DatabaseEditChangeType, update?: TCell[]): [IGridUpdate<TCell>, boolean] {
    const key = GridDataKeysUtils.serialize(row);
    let created = false;

    if (!this.editorData.has(key)) {
      let source: TCell[] | undefined;

      if (type !== DatabaseEditChangeType.add) {
        source = this.data.getRowValue(row);
      } else {
        source = [...(update || [])];
      }

      this.editorData.set(key, {
        row,
        type,
        source,
        update: observable([...(source || update || [])]),
      });
      created = true;
    }

    return [this.editorData.get(key)!, created];
  }

  private compressCellEditHistory(key?: TKey): void {
    const currentHistoryEntry = this.history.getCurrentEntry();

    if (!currentHistoryEntry || !isGridHistoryEditCellData<TKey, TCell>(currentHistoryEntry)) {
      return;
    }

    const isEditingSameCell = key
      && GridDataKeysUtils.isElementsKeyEqual(currentHistoryEntry.data.key, key);
    const shouldCompressHistory = !isEditingSameCell;

    if (shouldCompressHistory) {
      this.history.compress(
        entry =>
          isGridHistoryEditCellData<TKey, TCell>(entry) &&
          GridDataKeysUtils.isElementsKeyEqual(entry.data.key, currentHistoryEntry.data.key),
        entries => {
          const firstEntry = entries[0]!;
          const lastEntry = entries[entries.length - 1]!;
          if (!isGridHistoryEditCellData<TKey, TCell>(firstEntry) || !isGridHistoryEditCellData<TKey, TCell>(lastEntry)) {
            throw new Error('Invalid history entry type');
          }
          return {
            source: GRID_HISTORY_SOURCE_EDIT_CELL,
            data: {
              key: currentHistoryEntry.data.key,
              value: lastEntry.data.value,
              prevValue: firstEntry.data.prevValue,
            },
          };
        },
        'lastSequence',
      );
    }
  }

  private updateHistoryWithCellValue(key: TKey, value: TCell): void {
    this.compressCellEditHistory(key);

    this.history.add({
      source: GRID_HISTORY_SOURCE_EDIT_CELL,
      data: {
        key,
        value,
        prevValue: this.getPrevCellValue(key),
      },
    });
  }

  private updateHistoryWithAddRow(key: TKey): void {
    this.compressCellEditHistory();

    const update = this.editorData.get(GridDataKeysUtils.serialize(key.row));
    const value = update?.update;

    this.history.add({
      source: GRID_HISTORY_SOURCE_ADD_ROW,
      data: {
        key,
        value,
      },
    });
  }

  private getPrevCellValue(key: TKey): TCell {
    const [update] = this.getOrCreateUpdate(key.row, DatabaseEditChangeType.update);
    const currentHistoryEntry = this.history.getCurrentEntry();
    const isEditingSameCell = currentHistoryEntry
      && isGridHistoryEditCellData<TKey, TCell>(currentHistoryEntry)
      && GridDataKeysUtils.isElementsKeyEqual(currentHistoryEntry.data.key, key);
    const initialValue = update.source?.[key.column.index] as TCell;
    const latestHistoryEntry = this.history.getState().findLast(
      entry => isGridHistoryEditCellData<TKey, TCell>(entry)
        && GridDataKeysUtils.isElementsKeyEqual(entry.data.key, key)
    );

    if (isEditingSameCell && currentHistoryEntry && isGridHistoryEditCellData<TKey, TCell>(currentHistoryEntry)) {
      return currentHistoryEntry.data.value;
    }

    if (latestHistoryEntry && isGridHistoryEditCellData<TKey, TCell>(latestHistoryEntry)) {
      return latestHistoryEntry.data.value;
    }

    return initialValue;
  }

  protected compareCellValue(valueA: TCell | undefined, valueB: TCell | undefined): boolean {
    const castedValueA = valueA === undefined ? '' : valueA;
    const castedValueB = valueB === undefined ? '' : valueB;

    if (typeof castedValueA === 'number' || typeof castedValueB === 'number') {
      return String(castedValueA) === String(castedValueB);
    }

    if (typeof castedValueA === 'boolean' || typeof castedValueB === 'boolean') {
      return String(castedValueA).toLowerCase() === String(castedValueB).toLowerCase();
    }

    return castedValueA === castedValueB;
  }

  protected applyResultToUpdate(update: IGridUpdate<TCell>, result?: TCell[]): void {
    if (result) {
      update.source = result;
    }

    if (update.type === DatabaseEditChangeType.add) {
      update.type = DatabaseEditChangeType.update;
    }
  }

  private handleUndo(entry: IHistoryEntry<unknown>): void {
    if (isGridHistoryEditCellData<TKey, TCell>(entry)) {
      this.setCellValue(entry.data.key, entry.data.prevValue);
    } else if (isGridHistoryAddRowData<TKey, TCell>(entry)) {
      this.deleteRow(entry.data.key.row, entry.data.key.column, true);
    }
  }

  private handleRedo(entry: IHistoryEntry<unknown>): void {
    if (isGridHistoryEditCellData<TKey, TCell>(entry)) {
      this.setCellValue(entry.data.key, entry.data.value);
    } else if (isGridHistoryAddRowData<TKey, TCell>(entry)) {
      this.addRow(entry.data.key.row, entry.data.value, entry.data.key.column, true);
    }
  }
}