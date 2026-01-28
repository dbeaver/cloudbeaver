/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import {
  ResultDataFormat,
  type SqlResultRow,
  type AsyncUpdateResultsDataBatchMutationVariables,
  type SqlResultColumn,
  type SqlResultRowMetaData,
} from '@cloudbeaver/core-sdk';
import { isNull } from '@cloudbeaver/core-utils';
import { isResultSetContentValue, isResultSetComplexValue } from '@dbeaver/result-set-api';

import { IDatabaseDataSource } from '../../IDatabaseDataSource.js';
import type { IDatabaseResultSet } from '../../IDatabaseResultSet.js';
import { DatabaseEditChangeType } from '../IDatabaseDataEditAction.js';
import { createResultSetContentValue } from './createResultSetContentValue.js';
import { createResultSetFileValue } from './createResultSetFileValue.js';
import type { IResultSetBlobValue } from './IResultSetBlobValue.js';
import { isResultSetBlobValue } from './isResultSetBlobValue.js';
import { isResultSetFileValue } from './isResultSetFileValue.js';
import { ResultSetDataAction } from './ResultSetDataAction.js';
import type { IResultSetValue } from './ResultSetFormatAction.js';
import { GridEditAction, type IGridEditActionData, type IGridUpdate } from '../Grid/GridEditAction.js';
import { GridHistoryAction } from '../Grid/GridHistoryAction.js';
import { injectable } from '@cloudbeaver/core-di';
import { IDatabaseDataResult } from '../../IDatabaseDataResult.js';
import type { IGridDataKey } from '../Grid/IGridDataKey.js';

export type IResultSetEditActionData = IGridEditActionData<IGridDataKey, IResultSetValue>;

@injectable(() => [IDatabaseDataSource, IDatabaseDataResult, ResultSetDataAction, GridHistoryAction])
export class ResultSetEditAction extends GridEditAction<SqlResultColumn, SqlResultRowMetaData, IGridDataKey, IResultSetValue, IDatabaseResultSet> {
  static override dataFormat = [ResultDataFormat.Resultset];

  constructor(
    source: IDatabaseDataSource,
    result: IDatabaseDataResult,
    protected override readonly data: ResultSetDataAction,
    history: GridHistoryAction<any, IDatabaseDataResult>,
  ) {
    super(
      source as unknown as IDatabaseDataSource<unknown, IDatabaseResultSet>,
      result as IDatabaseResultSet,
      data,
      history as unknown as GridHistoryAction<any, IDatabaseResultSet>,
    );

    if ((result as IDatabaseResultSet).data?.singleEntity) {
      this.features = ['add', 'delete', 'revert'];
    }
  }

  override set(key: IGridDataKey, value: IResultSetValue): void {
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

    super.set(key, value);
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

  protected override compareCellValue(valueA: IResultSetValue | undefined, valueB: IResultSetValue | undefined): boolean {
    const castedValueA = valueA === undefined ? '' : valueA;
    const castedValueB = valueB === undefined ? '' : valueB;

    if (typeof castedValueA === 'number' || typeof castedValueB === 'number') {
      return String(castedValueA) === String(castedValueB);
    }

    if (typeof castedValueA === 'boolean' || typeof castedValueB === 'boolean') {
      return String(castedValueA).toLowerCase() === String(castedValueB).toLowerCase();
    }

    if (isResultSetContentValue(castedValueA) && isResultSetContentValue(castedValueB)) {
      if ('text' in castedValueA && 'text' in castedValueB) {
        return castedValueA.text === castedValueB.text;
      }
    }

    return castedValueA === castedValueB;
  }

  protected override applyResultToUpdate(update: IGridUpdate<IResultSetValue>, result?: IResultSetValue[]): void {
    super.applyResultToUpdate(update, result);
    if (result) {
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
  }

  override updateResult(result: IDatabaseResultSet, index: number): void {
    super.updateResult(result, index);

    if (result.data?.singleEntity) {
      this.features = ['add', 'delete', 'revert'];
    }
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
