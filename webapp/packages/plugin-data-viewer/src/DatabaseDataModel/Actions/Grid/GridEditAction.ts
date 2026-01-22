/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, makeObservable, observable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';

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
import { IDatabaseDataResultAction } from '../IDatabaseDataResultAction.js';
import { GridHistoryAction } from './GridHistoryAction.js';
import { GridEditHistoryManager } from './GridEditHistoryManager.js';
import type { IGridHistoryCancelData, IGridHistoryData, IGridHistoryRevertData } from './GridHistoryTypes.js';

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
  protected readonly historyManager: GridEditHistoryManager<TKey, TCell>;

  constructor(
    source: IDatabaseDataSource<any, TResult>,
    result: TResult,
    data: IDatabaseDataResultAction<TKey, TResult>,
    history: GridHistoryAction<any, TResult>,
  ) {
    super(source, result);
    this.editorData = new Map();
    this.data = data as GridDataResultAction<TColumn, TRow, TKey, TCell, TResult>;
    this.historyManager = new GridEditHistoryManager<TKey, TCell>(history as GridHistoryAction<IGridHistoryData<TKey, TCell>, TResult>);

    makeObservable<this, 'editorData' | 'setCellValueInternal' | 'setRowValueInternal' | 'addRowInternal' | 'deleteRowInternal' | 'revertInternal'>(
      this,
      {
        editorData: observable,
        set: action,
        add: action,
        addRow: action,
        delete: action,
        deleteRow: action,
        revert: action,
        applyUpdate: action,
        applyPartialUpdate: action,
        setCellValueInternal: action,
        setRowValueInternal: action,
        addRowInternal: action,
        deleteRowInternal: action,
        revertInternal: action,
      },
    );

    this.historyManager.setupHandlers({
      setCell: this.setCellValueInternal.bind(this),
      setRow: this.setRowValueInternal.bind(this),
      addRow: this.addRowInternal.bind(this),
      deleteRow: this.deleteRowInternal.bind(this),
      revert: this.revertInternal.bind(this),
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
    const [update] = this.getOrCreateUpdate(key.row, DatabaseEditChangeType.update);
    const prevValue = update.update[key.column.index] as TCell;

    this.historyManager.recordCellEdit(key, value, prevValue);

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

  addRow(row?: IGridRowKey, value?: TCell[], column?: IGridColumnKey): void {
    if (!row) {
      row = this.data.getDefaultKey().row;
    }

    if (value === undefined) {
      value = this.data.columns.map(() => null) as TCell[];
    }

    row = this.getNextRowAdd(row);

    if (!column) {
      column = this.data.getDefaultKey().column;
    }

    const [update, created] = this.getOrCreateUpdate(row, DatabaseEditChangeType.add, value);

    if (created) {
      const key = { column, row } as TKey;
      const rowUpdate = this.editorData.get(GridDataKeysUtils.serialize(key.row));
      this.historyManager.recordAddRow(key, rowUpdate);

      this.action.execute({
        resultId: this.result.id,
        type: update.type,
        revert: false,
        value: [{ key }],
      });
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
    const duplicatedKeys: Array<{ key: TKey; value?: TCell[] }> = [];

    for (const key of keys) {
      let value = this.data.getRowValue(key.row);

      const editedValue = this.editorData.get(GridDataKeysUtils.serialize(key.row));

      if (editedValue) {
        value = editedValue.update;
      }

      const clonedValue = JSON.parse(JSON.stringify(value)) as TCell[];
      const newRow = this.getNextRowAdd(key.row);
      const newKey = { row: newRow, column: key.column } as TKey;

      this.getOrCreateUpdate(newRow, DatabaseEditChangeType.add, clonedValue);

      duplicatedKeys.push({ key: newKey, value: clonedValue });

      this.action.execute({
        resultId: this.result.id,
        type: DatabaseEditChangeType.add,
        revert: false,
        value: [{ key: newKey }],
      });
    }

    if (duplicatedKeys.length > 0) {
      this.historyManager.recordDuplicateRow(duplicatedKeys);
    }
  }

  delete(...keys: TKey[]): void {
    const reverted: Array<IDatabaseDataEditActionValue<TKey, TCell>> = [];
    const deleted: Array<IDatabaseDataEditActionValue<TKey, TCell>> = [];

    for (const key of keys) {
      const serializedKey = GridDataKeysUtils.serialize(key.row);
      const update = this.editorData.get(serializedKey);
      const rowValue = this.data.getRowValue(key.row);

      if (update?.type === DatabaseEditChangeType.add) {
        this.historyManager.recordDeleteRow(key, update, rowValue);
        reverted.push({ key });
        this.editorData.delete(serializedKey);
      } else {
        this.historyManager.recordDeleteRow(key, update, rowValue);
        this.deleteRowSilent(key.row);
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

    const historyUpdates: IGridHistoryRevertData<TKey, TCell>['updates'] = [];
    const historyDeletions: IGridHistoryRevertData<TKey, TCell>['deletions'] = [];
    const historyAdditions: IGridHistoryRevertData<TKey, TCell>['additions'] = [];

    for (const key of keys) {
      const row = GridDataKeysUtils.serialize(key.row);
      const update = this.editorData.get(row);

      if (!update) {
        continue;
      }

      let prevValue: TCell | undefined;
      let value: TCell | undefined;

      if (update.type === DatabaseEditChangeType.delete) {
        historyDeletions.push({ key, value: update.source ? [...update.source] : undefined });
        revertedDeletions.push({ key });
        this.editorData.delete(row);
      } else {
        prevValue = update.update[key.column.index];
        value = update.source?.[key.column.index] ?? (null as TCell);
        update.update[key.column.index] = value;

        if (update.type === DatabaseEditChangeType.add) {
          historyAdditions.push({ key, rowValue: update.update ? [...update.update] : undefined });
          revertedAdditions.push({ key, prevValue, value });
        } else {
          historyUpdates.push({ key, prevValue: prevValue as TCell, value: value as TCell });
          revertedUpdates.push({ key, prevValue, value });
        }
      }

      this.removeEmptyUpdate(update);
    }

    if (historyUpdates.length > 0 || historyDeletions.length > 0 || historyAdditions.length > 0) {
      this.historyManager.recordRevert({
        updates: historyUpdates,
        deletions: historyDeletions,
        additions: historyAdditions,
      });
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
    this.recordCancelHistory();

    this.editorData.clear();

    this.action.execute({
      resultId: this.result.id,
      revert: true,
    });
  }

  private recordCancelHistory(): void {
    if (this.editorData.size === 0) {
      return;
    }

    const historyUpdates: IGridHistoryCancelData<TKey, TCell>['updates'] = [];
    const historyDeletions: IGridHistoryCancelData<TKey, TCell>['deletions'] = [];
    const historyAdditions: IGridHistoryCancelData<TKey, TCell>['additions'] = [];

    for (const [, update] of this.editorData) {
      const key = { row: update.row, column: { index: 0 } } as TKey;

      if (update.type === DatabaseEditChangeType.delete) {
        historyDeletions.push({ key, value: update.source ? [...update.source] : undefined });
      } else if (update.type === DatabaseEditChangeType.add) {
        historyAdditions.push({ key, rowValue: update.update ? [...update.update] : undefined });
      } else if (update.source) {
        historyUpdates.push({
          key,
          prevValue: [...update.update],
          value: [...update.source],
        });
      }
    }

    if (historyUpdates.length > 0 || historyDeletions.length > 0 || historyAdditions.length > 0) {
      this.historyManager.recordCancel({
        updates: historyUpdates,
        deletions: historyDeletions,
        additions: historyAdditions,
      });
    }
  }

  private deleteRowSilent(row: IGridRowKey): void {
    const serializedKey = GridDataKeysUtils.serialize(row);
    const update = this.editorData.get(serializedKey);

    if (row.subIndex !== 0 && !update) {
      return;
    }

    if (update && update.type !== DatabaseEditChangeType.delete) {
      this.editorData.delete(serializedKey);
    }

    if (update?.type !== DatabaseEditChangeType.add) {
      this.getOrCreateUpdate(row, DatabaseEditChangeType.delete);
    }
  }

  private setCellValueInternal(key: TKey, value: TCell): void {
    const [update] = this.getOrCreateUpdate(key.row, DatabaseEditChangeType.update);
    update.update[key.column.index] = value;
    this.removeEmptyUpdate(update);
  }

  private setRowValueInternal(key: TKey, value: TCell[]): void {
    const [update] = this.getOrCreateUpdate(key.row, DatabaseEditChangeType.update);
    for (let i = 0; i < value.length; i++) {
      update.update[i] = value[i]!;
    }
    this.removeEmptyUpdate(update);
  }

  private addRowInternal(row: IGridRowKey, value: TCell[] | undefined, column: IGridColumnKey): void {
    if (value === undefined) {
      value = this.data.columns.map(() => null) as TCell[];
    }

    this.getOrCreateUpdate(row, DatabaseEditChangeType.add, value);
  }

  private deleteRowInternal(row: IGridRowKey, _column: IGridColumnKey): void {
    const serializedKey = GridDataKeysUtils.serialize(row);
    const update = this.editorData.get(serializedKey);

    if (update?.type === DatabaseEditChangeType.add) {
      this.editorData.delete(serializedKey);
    } else if (update) {
      this.editorData.delete(serializedKey);
      this.getOrCreateUpdate(row, DatabaseEditChangeType.delete);
    } else {
      this.getOrCreateUpdate(row, DatabaseEditChangeType.delete);
    }
  }

  private revertInternal(keys: TKey[]): void {
    for (const key of keys) {
      const row = GridDataKeysUtils.serialize(key.row);
      const update = this.editorData.get(row);

      if (!update) {
        continue;
      }

      if (update.type === DatabaseEditChangeType.delete) {
        this.editorData.delete(row);
      } else {
        const value = update.source?.[key.column.index] ?? (null as TCell);
        update.update[key.column.index] = value;
        this.removeEmptyUpdate(update);
      }
    }
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
}
