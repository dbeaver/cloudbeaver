/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ResultDataFormat, type DataTypeLogicalOperation, type SqlResultColumn, type SqlResultRowMetaData } from '@cloudbeaver/core-sdk';
import { isResultSetContentValue, type IResultSetContentValue } from '@dbeaver/result-set-api';

import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { IDatabaseDataResult } from '../../IDatabaseDataResult.js';
import { IDatabaseDataSource } from '../../IDatabaseDataSource.js';
import type { IDatabaseResultSet } from '../../IDatabaseResultSet.js';
import { GridDataResultAction } from '../Grid/GridDataResultAction.js';
import type { IGridColumnKey, IGridDataKey, IGridRowKey } from '../Grid/IGridDataKey.js';
import type { IResultSetValue } from './ResultSetFormatAction.js';

export class ResultSetDataActionImpl extends GridDataResultAction<
  SqlResultColumn,
  SqlResultRowMetaData,
  IGridDataKey,
  IResultSetValue,
  IDatabaseResultSet
> {
  static override dataFormat = [ResultDataFormat.Resultset];

  get rows(): SqlResultRowMetaData[] {
    return this.result.data?.rowsWithMetaData || [];
  }

  get columns(): SqlResultColumn[] {
    return this.result.data?.columns || [];
  }

  constructor(source: IDatabaseDataSource, result: IDatabaseDataResult) {
    super(source as unknown as IDatabaseDataSource<unknown, IDatabaseResultSet>, result as IDatabaseResultSet);
  }

  override getColumnName(key: IGridColumnKey): string | undefined {
    return this.getColumn(key)?.name;
  }

  insertRow(row: IGridRowKey, value: IResultSetValue[], shift = 0): IGridRowKey | undefined {
    if (this.result.data?.rowsWithMetaData) {
      const index = row.index + shift;
      this.result.data.rowsWithMetaData.splice(index, 0, { data: value, metaData: {} });

      return { index, subIndex: 0 };
    }

    return undefined;
  }

  removeRow(row: IGridRowKey, shift = 0): IGridRowKey | undefined {
    if (this.result.data?.rowsWithMetaData) {
      const index = row.index + shift;
      this.result.data.rowsWithMetaData.splice(index, 1);

      return { index: index - 1, subIndex: 0 };
    }

    return undefined;
  }

  setRowValue(row: IGridRowKey, value: IResultSetValue[], shift = 0): void {
    if (this.result.data?.rowsWithMetaData) {
      this.result.data.rowsWithMetaData[row.index + shift] = { data: value, metaData: this.getRowMetadata(row) };
    }
  }

  getRowValue(row: IGridRowKey): IResultSetValue[] | undefined {
    if (row.index >= this.rows.length) {
      return undefined;
    }

    return this.rows[row.index]?.data;
  }

  getRowMetadata(row: IGridRowKey): Record<string, any> | undefined {
    if (row.index >= this.rows.length) {
      return undefined;
    }

    return this.rows[row.index]?.metaData;
  }

  getContent(cell: IGridDataKey): IResultSetContentValue | null {
    const row = this.getRowValue(cell.row);
    const value = row?.[cell.column.index];

    if (isResultSetContentValue(value)) {
      return value;
    }

    return null;
  }

  getColumnOperations(key: IGridColumnKey): DataTypeLogicalOperation[] {
    const column = this.getColumn(key);

    if (!column) {
      return [];
    }

    return column.supportedOperations.filter(operation => operation.argumentCount === 1 || operation.argumentCount === 0);
  }
}

export type ResultSetDataAction = ResultSetDataActionImpl;

export class ResultSetDataActionDI extends Context.Service<ResultSetDataActionDI, ResultSetDataActionImpl>()(
  '@cloudbeaver/plugin-data-viewer/DatabaseDataModel/Actions/ResultSet/ResultSetDataAction#ResultSetDataAction',
) {
  static readonly implementation = ResultSetDataActionImpl;
  static readonly dataFormat = ResultSetDataActionImpl.dataFormat;
  static readonly dependencies = () => [IDatabaseDataSource, IDatabaseDataResult] as const;
  static readonly make: Effect.Effect<
    ResultSetDataActionImpl,
    never,
    Context.Service.Identifier<typeof IDatabaseDataSource> | Context.Service.Identifier<typeof IDatabaseDataResult>
  > = Effect.gen(function* makeResultSetDataAction() {
    const source = yield* IDatabaseDataSource;
    const result = yield* IDatabaseDataResult;

    return new ResultSetDataActionImpl(source, result);
  });
  static readonly layer: Layer.Layer<
    ResultSetDataActionDI,
    never,
    Context.Service.Identifier<typeof IDatabaseDataSource> | Context.Service.Identifier<typeof IDatabaseDataResult>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const ResultSetDataAction = ResultSetDataActionDI;
