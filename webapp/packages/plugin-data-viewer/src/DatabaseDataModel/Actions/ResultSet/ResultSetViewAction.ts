/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { type DataTypeLogicalOperation, ResultDataFormat, type SqlResultColumn, type SqlResultRowMetaData } from '@cloudbeaver/core-sdk';
import { type IResultSetComplexValue, isResultSetContentValue } from '@dbeaver/result-set-api';

import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { IDatabaseDataResult } from '../../IDatabaseDataResult.js';
import { IDatabaseDataSource } from '../../IDatabaseDataSource.js';
import type { IDatabaseResultSet } from '../../IDatabaseResultSet.js';
import { GridViewActionImpl } from '../Grid/GridViewAction.js';
import type { IGridColumnKey, IGridDataKey } from '../Grid/IGridDataKey.js';
import type { IDatabaseDataEditAction } from '../IDatabaseDataEditAction.js';
import { ResultSetDataAction } from './ResultSetDataAction.js';
import { ResultSetEditAction } from './ResultSetEditAction.js';
import type { IResultSetValue } from './ResultSetFormatAction.js';

export class ResultSetViewActionImpl extends GridViewActionImpl<
  SqlResultColumn,
  SqlResultRowMetaData,
  IGridDataKey,
  IResultSetValue,
  IDatabaseResultSet
> {
  static override dataFormat = [ResultDataFormat.Resultset];

  constructor(source: IDatabaseDataSource, result: IDatabaseDataResult, data: ResultSetDataAction, editor: ResultSetEditAction) {
    super(
      source as unknown as IDatabaseDataSource<unknown, IDatabaseResultSet>,
      result as IDatabaseResultSet,
      data,
      editor as unknown as IDatabaseDataEditAction,
    );
  }

  getContent(cell: IGridDataKey): IResultSetComplexValue | null {
    const holder = this.getCellHolder(cell);

    if (isResultSetContentValue(holder.value)) {
      return holder.value;
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

export type ResultSetViewAction = ResultSetViewActionImpl;

export class ResultSetViewActionDI extends Context.Service<ResultSetViewActionDI, ResultSetViewActionImpl>()(
  '@cloudbeaver/plugin-data-viewer/DatabaseDataModel/Actions/ResultSet/ResultSetViewAction#ResultSetViewAction',
) {
  static readonly implementation = ResultSetViewActionImpl;
  static readonly dataFormat = ResultSetViewActionImpl.dataFormat;
  static readonly dependencies = () => [IDatabaseDataSource, IDatabaseDataResult, ResultSetDataAction, ResultSetEditAction] as const;
  static readonly make: Effect.Effect<
    ResultSetViewActionImpl,
    never,
    | Context.Service.Identifier<typeof IDatabaseDataSource>
    | Context.Service.Identifier<typeof IDatabaseDataResult>
    | Context.Service.Identifier<typeof ResultSetDataAction>
    | Context.Service.Identifier<typeof ResultSetEditAction>
  > = Effect.gen(function* makeResultSetViewAction() {
    const source = yield* IDatabaseDataSource;
    const result = yield* IDatabaseDataResult;
    const data = yield* ResultSetDataAction;
    const editor = yield* ResultSetEditAction;

    return new ResultSetViewActionImpl(source, result, data, editor);
  });
  static readonly layer: Layer.Layer<
    ResultSetViewActionDI,
    never,
    | Context.Service.Identifier<typeof IDatabaseDataSource>
    | Context.Service.Identifier<typeof IDatabaseDataResult>
    | Context.Service.Identifier<typeof ResultSetDataAction>
    | Context.Service.Identifier<typeof ResultSetEditAction>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const ResultSetViewAction = ResultSetViewActionDI;
