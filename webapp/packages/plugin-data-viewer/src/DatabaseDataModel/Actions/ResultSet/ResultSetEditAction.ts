/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, makeObservable, observable } from 'mobx';

import { type ISyncExecutor, SyncExecutor } from '@cloudbeaver/core-executor';
import { ResultDataFormat, type SqlResultRow, type AsyncUpdateResultsDataBatchMutationVariables } from '@cloudbeaver/core-sdk';
import { isNull } from '@cloudbeaver/core-utils';
import { isResultSetContentValue, isResultSetComplexValue } from '@dbeaver/result-set-api';

import type { IDatabaseDataSource } from '../../IDatabaseDataSource.js';
import type { IDatabaseResultSet } from '../../IDatabaseResultSet.js';
import { databaseDataAction } from '../DatabaseDataActionDecorator.js';
import { DatabaseEditAction } from '../DatabaseEditAction.js';
import {
  DatabaseEditChangeType,
  type IDatabaseDataEditActionData,
  type IDatabaseDataEditActionValue,
  type IDatabaseDataEditApplyActionData,
  type IDatabaseDataEditApplyActionUpdate,
} from '../IDatabaseDataEditAction.js';
import { compareResultSetRowKeys } from './compareResultSetRowKeys.js';
import { createResultSetContentValue } from './createResultSetContentValue.js';
import { createResultSetFileValue } from './createResultSetFileValue.js';
import type { IResultSetBlobValue } from './IResultSetBlobValue.js';
import type { IResultSetColumnKey, IResultSetElementKey, IResultSetRowKey } from './IResultSetDataKey.js';
import { isResultSetBlobValue } from './isResultSetBlobValue.js';
import { isResultSetFileValue } from './isResultSetFileValue.js';
import { ResultSetDataAction } from './ResultSetDataAction.js';
import { ResultSetDataKeysUtils } from './ResultSetDataKeysUtils.js';
import type { IResultSetValue } from './ResultSetFormatAction.js';

export interface IResultSetUpdate {
  row: IResultSetRowKey;
  type: DatabaseEditChangeType;
  update: IResultSetValue[];
  source?: IResultSetValue[];
}

export type IResultSetEditActionData = IDatabaseDataEditActionData<IResultSetElementKey, IResultSetValue>;

@databaseDataAction()
export class ResultSetEditAction extends DatabaseEditAction<IResultSetElementKey, IResultSetValue, IDatabaseResultSet> {
  static override dataFormat = [ResultDataFormat.Resultset];

  override readonly applyAction: ISyncExecutor<IDatabaseDataEditApplyActionData<IResultSetRowKey>>;
  private readonly editorData: Map<string, IResultSetUpdate>;
  private readonly data: ResultSetDataAction;

  constructor(source: IDatabaseDataSource<any, IDatabaseResultSet>, data: ResultSetDataAction) {
    super(source);
    this.applyAction = new SyncExecutor();
    this.editorData = new Map();
    this.data = data;
    this.features = [];

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

  get addRows(): IResultSetRowKey[] {
    return Array.from(this.editorData.values())
      .filter(update => update.type === DatabaseEditChangeType.add)
      .map(update => update.row);
  }

  get updates(): IResultSetUpdate[] {
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
    return this.editorData.get(ResultSetDataKeysUtils.serialize(key.row))?.update[key.column.index];
  }

  set(key: IResultSetElementKey, value: IResultSetValue): void {
    const [update] = this.getOrCreateUpdate(key.row, DatabaseEditChangeType.update);
    const prevValue = update.source?.[key.column.index] as any;

    if (isResultSetContentValue(prevValue) && !isResultSetComplexValue(value)) {
      if ('text' in prevValue && !isNull(value)) {
        value = createResultSetContentValue({
          text: String(value),
          contentLength: String(value).length,
          contentType: prevValue.contentType ?? 'text/plain',
        });
      }
    }

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

  add(key?: IResultSetElementKey): void {
    this.addRow(key?.row, undefined, key?.column);
  }

  addRow(row?: IResultSetRowKey, value?: IResultSetValue[], column?: IResultSetColumnKey): void {
    if (!row) {
      row = this.data.getDefaultKey().row;
    }

    if (value === undefined) {
      value = this.data.columns.map(() => null);
    }

    row = this.getNextRowAdd(row);

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
            key: { column, row },
          },
        ],
      });
    }
  }

  duplicate(...keys: IResultSetElementKey[]): void {
    const result: IResultSetElementKey[] = [];
    const rowKeys = new Set<string>();

    for (const key of keys) {
      const serialized = ResultSetDataKeysUtils.serialize(key.row);

      if (!rowKeys.has(serialized)) {
        result.push(key);
        rowKeys.add(serialized);
      }
    }

    this.duplicateRow(...result);
  }

  duplicateRow(...keys: IResultSetElementKey[]): void {
    for (const key of keys) {
      let value = this.data.getRowValue(key.row);

      const editedValue = this.editorData.get(ResultSetDataKeysUtils.serialize(key.row));

      if (editedValue) {
        value = editedValue.update;
      }

      this.addRow(key.row, JSON.parse(JSON.stringify(value)), key.column);
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
              key: { column, row: key },
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
            key: { column, row: key },
          },
        ],
      });
    }
  }

  applyPartialUpdate(result: IDatabaseResultSet): void {
    if (result.data?.rowsWithMetaData?.length !== this.updates.length) {
      console.warn('ResultSetEditAction: returned data differs from performed update');
    }

    const applyUpdate: Array<IDatabaseDataEditApplyActionUpdate<IResultSetRowKey>> = [];

    const tempUpdates = this.updates
      .map((update, i) => ({
        rowIndex: update.type === DatabaseEditChangeType.delete ? -1 : i,
        update,
      }))
      .sort((a, b) => compareResultSetRowKeys(b.update.row, a.update.row));

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
      const value = result.data?.rowsWithMetaData?.[update.rowIndex]?.data;
      const row = update.update.row;
      const type = update.update.type;

      switch (update.update.type) {
        case DatabaseEditChangeType.update: {
          if (value) {
            this.data.setRowValue(update.update.row, value);
          }
          applyResultToUpdate(update.update, value);
          this.shiftRow(update.update.row, offset);
          this.removeEmptyUpdate(update.update);
          break;
        }

        case DatabaseEditChangeType.add: {
          if (value) {
            this.data.insertRow(update.update.row, value, 1);
          }
          applyResultToUpdate(update.update, value);
          this.shiftRow(update.update.row, offset);
          this.removeEmptyUpdate(update.update);
          offset--;
          break;
        }

        case DatabaseEditChangeType.delete: {
          this.revert({ row: update.update.row, column: { index: 0 } });
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
        resultId: result.id,
        updates: applyUpdate,
      });
    }
  }

  applyUpdate(result: IDatabaseResultSet): void {
    this.applyPartialUpdate(result);

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

  getBlobsToUpload(): Array<IResultSetBlobValue> {
    const blobs: Array<IResultSetBlobValue> = [];

    for (const update of this.updates) {
      if (update.type === DatabaseEditChangeType.delete) {
        continue;
      }

      for (let i = 0; i < update.update.length; i++) {
        const value = update.update[i];
        if (isResultSetBlobValue(value) && value.fileId === null) {
          blobs.push(value);
        }
      }
    }

    return blobs;
  }

  fillBatch(batch: AsyncUpdateResultsDataBatchMutationVariables): void {
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
                if (isResultSetBlobValue(value)) {
                  if (value.fileId !== null) {
                    obj[index] = createResultSetFileValue(value.fileId, value.contentType, value.contentLength);
                  }
                } else if (value !== update.source![index]) {
                  obj[index] = value;
                }
                return obj;
              }, {}),
              metaData: this.data.getRowMetadata(update.row),
            });
          }
          break;
        }

        case DatabaseEditChangeType.add: {
          if (batch.addedRows === undefined) {
            batch.addedRows = [];
          }
          const addedRows = batch.addedRows as SqlResultRow[];

          addedRows.push({ data: replaceUploadBlobs(update.update) });
          break;
        }

        case DatabaseEditChangeType.delete: {
          if (batch.deletedRows === undefined) {
            batch.deletedRows = [];
          }
          const deletedRows = batch.deletedRows as SqlResultRow[];

          deletedRows.push({ data: replaceBlobsWithNull(update.update), metaData: this.data.getRowMetadata(update.row) });
          break;
        }
      }
    }
  }

  override updateResult(result: IDatabaseResultSet, index: number): void {
    super.updateResult(result, index);

    if (result.data?.singleEntity) {
      this.features = ['add', 'delete', 'revert'];
    }
  }

  clear(): void {
    this.editorData.clear();

    this.action.execute({
      resultId: this.result.id,
      revert: true,
    });
  }

  private getNextRowAdd(row: IResultSetRowKey): IResultSetRowKey {
    let i = row.subIndex + 1;
    while (this.editorData.has(ResultSetDataKeysUtils.serialize({ ...row, subIndex: i }))) {
      i++;
    }

    return { ...row, subIndex: i };
  }

  private shiftRow(row: IResultSetRowKey, shift: number) {
    const key = ResultSetDataKeysUtils.serialize(row);
    const update = this.editorData.get(ResultSetDataKeysUtils.serialize(row));

    if (update) {
      update.row = {
        index: update.row.index + shift,
        subIndex: 0,
      };
      this.editorData.delete(key);
      this.editorData.set(ResultSetDataKeysUtils.serialize(update.row), update);
    }
  }

  private removeEmptyUpdate(update: IResultSetUpdate) {
    if (update.type === DatabaseEditChangeType.add) {
      return;
    }

    if (update.source && !update.source.some((value, i) => !this.compareCellValue(value, update.update[i]))) {
      this.editorData.delete(ResultSetDataKeysUtils.serialize(update.row));
    }
  }

  private getOrCreateUpdate(row: IResultSetRowKey, type: DatabaseEditChangeType, update?: IResultSetValue[]): [IResultSetUpdate, boolean] {
    const key = ResultSetDataKeysUtils.serialize(row);
    let created = false;

    if (!this.editorData.has(key)) {
      let source: IResultSetValue[] | undefined;

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

function replaceBlobsWithNull(values: IResultSetValue[]) {
  return values.map(value => {
    if (isResultSetBlobValue(value)) {
      return null;
    }
    return value;
  });
}

function replaceUploadBlobs(values: IResultSetValue[]) {
  return values.map(value => {
    if (isResultSetBlobValue(value)) {
      if (value.fileId !== null) {
        return createResultSetFileValue(value.fileId, value.contentType, value.contentLength);
      } else {
        return null;
      }
    }
    return value;
  });
}

function applyResultToUpdate(update: IResultSetUpdate, result?: IResultSetValue[]): void {
  if (result) {
    update.source = result;

    update.update = update.update.map((value, i) => {
      const source = update.source![i];
      if (isResultSetContentValue(source) && isResultSetFileValue(value)) {
        if (value.fileId && value.contentLength === source.contentLength) {
          return JSON.parse(JSON.stringify(source));
        }
      }
      return value;
    });
  }

  if (update.type === DatabaseEditChangeType.add) {
    update.type = DatabaseEditChangeType.update;
  }
}
