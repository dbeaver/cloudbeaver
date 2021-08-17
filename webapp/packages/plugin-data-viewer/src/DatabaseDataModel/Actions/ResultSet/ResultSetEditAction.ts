/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed, makeObservable, observable } from 'mobx';

import { ResultDataFormat, SqlResultRow, UpdateResultsDataBatchMutationVariables } from '@cloudbeaver/core-sdk';
import { uuid } from '@cloudbeaver/core-utils';

import type { IDatabaseDataSource } from '../../IDatabaseDataSource';
import type { IDatabaseResultSet } from '../../IDatabaseResultSet';
import { databaseDataAction } from '../DatabaseDataActionDecorator';
import { DatabaseEditAction } from '../DatabaseEditAction';
import type { IDatabaseDataEditActionData } from '../IDatabaseDataEditAction';
import type { IResultSetElementKey, IResultSetRowKey } from './IResultSetDataKey';
import { isResultSetContentValue } from './isResultSetContentValue';
import { ResultSetDataAction } from './ResultSetDataAction';
import { ResultSetDataKeysUtils } from './ResultSetDataKeysUtils';
import type { IResultSetValue } from './ResultSetFormatAction';

// order is matter, used for sorting and changes diff
export enum ResultSetChangeType {
  update,
  add,
  delete
}

export interface IResultSetUpdate {
  row: IResultSetRowKey;
  type: ResultSetChangeType;
  update: IResultSetValue[];
  source?: IResultSetValue[];
}

export type IResultSetEditActionData = IDatabaseDataEditActionData<IResultSetElementKey, IResultSetValue>;

@databaseDataAction()
export class ResultSetEditAction
  extends DatabaseEditAction<IResultSetElementKey, IResultSetValue, IDatabaseResultSet> {
  static dataFormat = ResultDataFormat.Resultset;

  private editorData: Map<string, IResultSetUpdate>;
  private data: ResultSetDataAction;

  constructor(source: IDatabaseDataSource<any, IDatabaseResultSet>, result: IDatabaseResultSet) {
    super(source, result);
    this.editorData = new Map();
    this.data = this.getAction(ResultSetDataAction);

    makeObservable<this, 'editorData'>(this, {
      editorData: observable.shallow,
      addRows: computed,
      updates: computed,
    });
  }

  get addRows(): IResultSetRowKey[] {
    return Array.from(this.editorData.values())
      .filter(update => update.type === ResultSetChangeType.add)
      .map(update => update.row);
  }

  get updates(): IResultSetUpdate[] {
    return Array.from(this.editorData.values())
      .sort((a, b) => {
        if (a.row.index === b.row.index) {
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

    if (update.source === undefined || update.type === ResultSetChangeType.delete) {
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

  getElementState(key: IResultSetElementKey): ResultSetChangeType | null {
    const update = this.editorData.get(ResultSetDataKeysUtils.serialize(key.row));

    if (!update) {
      return null;
    }

    return update.type;
  }

  set(key: IResultSetElementKey, value: IResultSetValue): void {
    const update = this.getOrCreateUpdate(key.row, ResultSetChangeType.update);
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
      type: 'edit',
      value: {
        key,
        prevValue,
        value,
      },
    });

    this.removeEmptyUpdate(update);
  }

  get(key: IResultSetElementKey): IResultSetValue | undefined {
    return this.editorData
      .get(ResultSetDataKeysUtils.serialize(key.row))
      ?.update[key.column.index];
  }

  add(key: IResultSetRowKey, value?: IResultSetValue[]): void {
    if (value === undefined) {
      value = this.data.columns.map(() => null);
    }

    this.getOrCreateUpdate({ ...key, key: uuid() }, ResultSetChangeType.add, value);
  }

  delete(key: IResultSetRowKey): void {
    this.getOrCreateUpdate(key, ResultSetChangeType.delete);
  }

  applyUpdate(result: IDatabaseResultSet): void {
    let rowIndex = 0;
    let shift = 0;

    for (const update of this.updates) {
      switch (update.type) {
        case ResultSetChangeType.update: {
          if (update.source) {
            const value = result.data?.rows?.[rowIndex];

            if (value !== undefined) {
              this.data.setRowValue(update.row, value, shift);
            }
            rowIndex++;
          }
          break;
        }

        case ResultSetChangeType.add: {
          const value = result.data?.rows?.[rowIndex];
          if (value !== undefined) {
            this.data.insertRow(update.row, value, shift);
          }
          rowIndex++;
          shift++;
          break;
        }

        case ResultSetChangeType.delete: {
          this.data.removeRow(update.row, shift);
          shift--;
          break;
        }
      }
    }
    this.clear();
  }

  revert(key: IResultSetElementKey): void {
    const row = ResultSetDataKeysUtils.serialize(key.row);
    const update = this.editorData.get(row);

    if (!update) {
      return;
    }

    const prevValue = update.update[key.column.index];
    const value = update.source?.[key.column.index] ?? null;
    update.update[key.column.index] = value;

    this.action.execute({
      resultId: this.result.id,
      type: 'revert',
      value: {
        key,
        prevValue,
        value,
      },
    });

    this.removeEmptyUpdate(update);
  }

  clear(): void {
    this.editorData.clear();

    this.action.execute({
      resultId: this.result.id,
      type: 'revert',
    });
  }

  fillBatch(batch: UpdateResultsDataBatchMutationVariables): void {
    for (const update of this.updates) {
      switch (update.type) {
        case ResultSetChangeType.update: {
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

        case ResultSetChangeType.add: {
          if (batch.addedRows === undefined) {
            batch.addedRows = [];
          }
          const addedRows = batch.addedRows as SqlResultRow[];

          addedRows.push({ data: update.update });
          break;
        }

        case ResultSetChangeType.delete: {
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
    if (update.source && !update.source.some(
      (value, i) => !this.compareCellValue(value, update.update[i])
    )) {
      this.editorData.delete(ResultSetDataKeysUtils.serialize(update.row));
    }
  }

  private getOrCreateUpdate(
    row: IResultSetRowKey,
    type: ResultSetChangeType,
    update?: IResultSetValue[]
  ): IResultSetUpdate {
    const key = ResultSetDataKeysUtils.serialize(row);

    if (!this.editorData.has(key)) {
      let source: IResultSetValue[] | undefined;

      if (type !== ResultSetChangeType.add) {
        source = this.data.getRowValue(row);
      }

      this.editorData.set(key, {
        row,
        type,
        source,
        update: observable([...(source || update || [])]),
      });
    }

    return this.editorData.get(key)!;
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
