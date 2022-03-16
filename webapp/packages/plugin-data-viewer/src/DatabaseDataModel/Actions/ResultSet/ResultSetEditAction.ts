/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, computed, makeObservable, observable } from 'mobx';

import { ISyncExecutor, SyncExecutor } from '@cloudbeaver/core-executor';
import { ResultDataFormat, SqlResultRow, UpdateResultsDataBatchMutationVariables } from '@cloudbeaver/core-sdk';
import { uuid } from '@cloudbeaver/core-utils';

import type { IDatabaseDataSource } from '../../IDatabaseDataSource';
import type { IDatabaseResultSet } from '../../IDatabaseResultSet';
import { databaseDataAction } from '../DatabaseDataActionDecorator';
import { DatabaseEditAction } from '../DatabaseEditAction';
import { DatabaseEditChangeType, IDatabaseDataEditActionData, IDatabaseDataEditActionValue, IDatabaseDataEditApplyActionData, IDatabaseDataEditApplyActionUpdate } from '../IDatabaseDataEditAction';
import type { IResultSetColumnKey, IResultSetElementKey, IResultSetRowKey } from './IResultSetDataKey';
import { isResultSetContentValue } from './isResultSetContentValue';
import { ResultSetDataAction } from './ResultSetDataAction';
import { ResultSetDataKeysUtils } from './ResultSetDataKeysUtils';
import type { IResultSetValue } from './ResultSetFormatAction';

export interface IResultSetUpdate {
  row: IResultSetRowKey;
  type: DatabaseEditChangeType;
  update: IResultSetValue[];
  source?: IResultSetValue[];
}

export type IResultSetEditActionData = IDatabaseDataEditActionData<IResultSetElementKey, IResultSetValue>;

@databaseDataAction()
export class ResultSetEditAction
  extends DatabaseEditAction<IResultSetElementKey, IResultSetValue, IDatabaseResultSet> {
  static dataFormat = [ResultDataFormat.Resultset];

  readonly applyAction: ISyncExecutor<IDatabaseDataEditApplyActionData<IResultSetRowKey>>;
  private readonly editorData: Map<string, IResultSetUpdate>;
  private readonly data: ResultSetDataAction;

  constructor(
    source: IDatabaseDataSource<any, IDatabaseResultSet>,
    result: IDatabaseResultSet,
    data: ResultSetDataAction
  ) {
    super(source, result);
    this.applyAction = new SyncExecutor();
    this.editorData = new Map();
    this.data = data;
    this.features = [];

    if (result.data?.singleEntity) {
      this.features = ['add', 'delete'];
    }

    makeObservable<this, 'editorData'>(this, {
      editorData: observable,
      addRows: computed,
      updates: computed,
      set: action,
      add: action,
      addRow: action,
      delete: action,
      deleteRow: action,
      revert: action,
      applyUpdate: action,
    });
  }

  get addRows(): IResultSetRowKey[] {
    return Array.from(this.editorData.values())
      .filter(update => update.type === DatabaseEditChangeType.add)
      .map(update => update.row);
  }

  get updates(): IResultSetUpdate[] {
    return Array.from(this.editorData.values())
      .sort((a, b) => {
        if (a.type !== b.type) {
          if (a.type === DatabaseEditChangeType.update) {
            return -1;
          }

          if (b.type === DatabaseEditChangeType.update) {
            return 1;
          }

          return a.type - b.type;
        }

        return a.row.index - b.row.index;
      });
  }

  isEdited(): boolean {
    return this.editorData.size > 0;
  }

  isElementEdited(key: IResultSetElementKey): boolean {
    const update = this.editorData.get(ResultSetDataKeysUtils.serialize(key.row));

    if (!update) {
      return false;
    }

    if (update.source === undefined || update.type === DatabaseEditChangeType.delete) {
      return true;
    }

    return !this.compareCellValue(update.source[key.column.index], update.update[key.column.index]);
  }

  isRowEdited(key: IResultSetRowKey): boolean {
    const update = this.editorData.get(ResultSetDataKeysUtils.serialize(key));

    if (!update) {
      return false;
    }

    return true;
  }

  getElementState(key: IResultSetElementKey): DatabaseEditChangeType | null {
    const update = this.editorData.get(ResultSetDataKeysUtils.serialize(key.row));

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

  get(key: IResultSetElementKey): IResultSetValue | undefined {
    return this.editorData
      .get(ResultSetDataKeysUtils.serialize(key.row))
      ?.update[key.column.index];
  }

  set(key: IResultSetElementKey, value: IResultSetValue): void {
    const [update] = this.getOrCreateUpdate(key.row, DatabaseEditChangeType.update);
    const prevValue = update.source?.[key.column.index] as any;

    if (isResultSetContentValue(prevValue) && value !== null) {
      if ('text' in prevValue) {
        value = {
          ...prevValue,
          text: String(value),
          contentLength: String(value).length,
        };
      }
    }

    update.update[key.column.index] = value;

    this.action.execute({
      resultId: this.result.id,
      type: update.type,
      revert: false,
      value: [{
        key,
        prevValue,
        value,
      }],
    });

    this.removeEmptyUpdate(update);
  }

  add(key?: IResultSetElementKey): void {
    this.addRow(key?.row, undefined, key?.column);
  }

  addRow(row?: IResultSetRowKey, value?: IResultSetValue[], column?: IResultSetColumnKey): void {
    if (!row) {
      row = this.data.getDefaultKey().row;
    } else if (!('key' in row)) {
      row = { ...row, index: row.index + 1 };
    }

    if (value === undefined) {
      value = this.data.columns.map(() => null);
    }

    row = { ...row, key: uuid() };

    if (!column) {
      column = this.data.getDefaultKey().column;
    }

    const [update, created] = this.getOrCreateUpdate(row, DatabaseEditChangeType.add, value);

    if (created) {
      this.action.execute({
        resultId: this.result.id,
        type: update.type,
        revert: false,
        value: [{
          key: { column, row },
        }],
      });
    }
  }

  duplicate(...keys: IResultSetElementKey[]): void {
    const rows: IResultSetRowKey[] = [];
    const rowKeys = new Set<string>();

    for (const key of keys) {
      const serialized = ResultSetDataKeysUtils.serialize(key.row);

      if (!rowKeys.has(serialized)) {
        rows.push(key.row);
        rowKeys.add(serialized);
      }
    }

    this.duplicateRow(...rows);
  }

  duplicateRow(...rows: IResultSetRowKey[]): void {
    for (const row of rows) {
      let value = this.data.getRowValue(row);

      const editedValue = this.editorData
        .get(ResultSetDataKeysUtils.serialize(row));

      if (editedValue) {
        value = editedValue.update;
      }

      this.addRow(row, JSON.parse(JSON.stringify(value)));
    }
  }

  delete(...keys: IResultSetElementKey[]): void {
    const reverted: Array<IDatabaseDataEditActionValue<IResultSetElementKey, IResultSetValue>> = [];
    const deleted: Array<IDatabaseDataEditActionValue<IResultSetElementKey, IResultSetValue>> = [];

    for (const key of keys) {
      const serializedKey = ResultSetDataKeysUtils.serialize(key.row);
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

  deleteRow(key: IResultSetRowKey, column?: IResultSetColumnKey, silent?: boolean): void {
    const serializedKey = ResultSetDataKeysUtils.serialize(key);
    const update = this.editorData.get(serializedKey);

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
          value: [{
            key: { column, row: key },
          }],
        });
      }
    } else if (!silent) {
      this.action.execute({
        resultId: this.result.id,
        type: update.type,
        revert: true,
        value: [{
          key: { column, row: key },
        }],
      });
    }
  }

  applyUpdate(result: IDatabaseResultSet): void {
    const applyUpdate: Array<IDatabaseDataEditApplyActionUpdate<IResultSetRowKey>> = [];
    let rowIndex = 0;
    let addShift = 0;
    let deleteShift = 0;

    const insertedRows: IResultSetRowKey[] = [];

    if (result.data?.rows?.length !== this.updates.length) {
      console.warn('ResultSetEditAction: returned data differs from performed update');
    }

    for (const update of this.updates) {
      switch (update.type) {
        case DatabaseEditChangeType.update: {
          const value = result.data?.rows?.[rowIndex];

          if (value !== undefined) {
            this.data.setRowValue(update.row, value);
            applyUpdate.push({
              type: DatabaseEditChangeType.update,
              row: update.row,
              newRow: update.row,
            });
          }

          rowIndex++;
          break;
        }

        case DatabaseEditChangeType.add: {
          const value = result.data?.rows?.[rowIndex];

          if (value !== undefined) {
            const newRow = this.data.insertRow(update.row, value, addShift);

            if (newRow) {
              applyUpdate.push({
                type: DatabaseEditChangeType.add,
                row: update.row,
                newRow,
              });
            }
          }

          insertedRows.push(update.row);
          rowIndex++;
          addShift++;
          break;
        }

        case DatabaseEditChangeType.delete: {
          const insertShift = insertedRows.filter(row => row.index <= update.row.index).length;
          const newRow = this.data.removeRow(update.row, deleteShift + insertShift);

          if (newRow) {
            applyUpdate.push({
              type: DatabaseEditChangeType.delete,
              row: update.row,
              newRow,
            });
          }

          deleteShift--;
          break;
        }
      }
    }

    if (applyUpdate.length > 0) {
      this.applyAction.execute({
        resultId: result.id,
        updates: applyUpdate,
      });
    }

    this.clear();
  }

  revert(...keys: IResultSetElementKey[]): void {
    const revertedUpdates: Array<IDatabaseDataEditActionValue<IResultSetElementKey, IResultSetValue>> = [];
    const revertedDeletions: Array<IDatabaseDataEditActionValue<IResultSetElementKey, IResultSetValue>> = [];
    const revertedAdditions: Array<IDatabaseDataEditActionValue<IResultSetElementKey, IResultSetValue>> = [];

    for (const key of keys) {
      const row = ResultSetDataKeysUtils.serialize(key.row);
      const update = this.editorData.get(row);

      if (!update) {
        continue;
      }

      let prevValue: IResultSetValue | undefined;
      let value: IResultSetValue | undefined;

      if (update.type === DatabaseEditChangeType.delete) {
        revertedDeletions.push({ key });
        this.editorData.delete(row);
      } else {
        prevValue = update.update[key.column.index];
        value = update.source?.[key.column.index] ?? null;
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

  fillBatch(batch: UpdateResultsDataBatchMutationVariables): void {
    for (const update of this.updates) {
      switch (update.type) {
        case DatabaseEditChangeType.update: {
          if (batch.updatedRows === undefined) {
            batch.updatedRows = [];
          }
          const updatedRows = batch.updatedRows as SqlResultRow[];

          if (update.source) {
            updatedRows.push({
              data: update.source,
              updateValues: update.update.reduce<Record<number, IResultSetValue>>((obj, value, index) => {
                if (value !== update.source![index]) {
                  obj[index] = value;
                }
                return obj;
              }, {}),
            });
          }
          break;
        }

        case DatabaseEditChangeType.add: {
          if (batch.addedRows === undefined) {
            batch.addedRows = [];
          }
          const addedRows = batch.addedRows as SqlResultRow[];

          addedRows.push({ data: update.update });
          break;
        }

        case DatabaseEditChangeType.delete: {
          if (batch.deletedRows === undefined) {
            batch.deletedRows = [];
          }
          const deletedRows = batch.deletedRows as SqlResultRow[];

          deletedRows.push({ data: update.update });
          break;
        }
      }
    }
  }

  private removeEmptyUpdate(update: IResultSetUpdate) {
    if (update.type === DatabaseEditChangeType.add) {
      return;
    }

    if (update.source && !update.source.some(
      (value, i) => !this.compareCellValue(value, update.update[i])
    )) {
      this.editorData.delete(ResultSetDataKeysUtils.serialize(update.row));
    }
  }

  private getOrCreateUpdate(
    row: IResultSetRowKey,
    type: DatabaseEditChangeType,
    update?: IResultSetValue[]
  ): [IResultSetUpdate, boolean] {
    const key = ResultSetDataKeysUtils.serialize(row);
    let created = false;

    if (!this.editorData.has(key)) {
      let source: IResultSetValue[] | undefined;

      if (type !== DatabaseEditChangeType.add) {
        source = this.data.getRowValue(row);
      } else {
        source = [...update || []];
      }

      this.editorData.set(key, {
        row,
        type,
        source,
        update: observable([...source || update || []]),
      });
      created = true;
    }

    return [this.editorData.get(key)!, created];
  }

  private compareCellValue(valueA: any, valueB: any) {
    valueA = valueA === undefined ? '' : valueA;
    valueB = valueB === undefined ? '' : valueB;

    if (typeof valueA === 'number' || typeof valueB === 'number') {
      return String(valueA) === String(valueB);
    }

    if (typeof valueA === 'boolean' || typeof valueB === 'boolean') {
      return String(valueA).toLowerCase() === String(valueB).toLowerCase();
    }

    if (isResultSetContentValue(valueA) && isResultSetContentValue(valueB)) {
      if ('text' in valueA && 'text' in valueB) {
        return valueA.text === valueB.text;
      }
    }

    return valueA === valueB;
  }
}
