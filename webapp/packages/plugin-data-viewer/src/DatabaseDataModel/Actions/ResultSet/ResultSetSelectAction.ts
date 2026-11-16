/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ResultDataFormat, type SqlResultColumn, type SqlResultRowMetaData } from '@cloudbeaver/core-sdk';

import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { IDatabaseDataResult } from '../../IDatabaseDataResult.js';
import { IDatabaseDataSource } from '../../IDatabaseDataSource.js';
import type { IDatabaseResultSet } from '../../IDatabaseResultSet.js';
import { GridSelectActionImpl } from '../Grid/GridSelectAction.js';
import type { IGridDataKey } from '../Grid/IGridDataKey.js';
import type { IDatabaseDataEditAction, IDatabaseDataEditApplyActionData } from '../IDatabaseDataEditAction.js';
import { ResultSetDataAction } from './ResultSetDataAction.js';
import { ResultSetEditAction } from './ResultSetEditAction.js';
import type { IResultSetValue } from './ResultSetFormatAction.js';
import { ResultSetViewAction } from './ResultSetViewAction.js';

export class ResultSetSelectActionImpl extends GridSelectActionImpl<
  SqlResultColumn,
  SqlResultRowMetaData,
  IResultSetValue,
  IGridDataKey,
  IDatabaseResultSet
> {
  static override dataFormat = [ResultDataFormat.Resultset];

  constructor(
    source: IDatabaseDataSource,
    result: IDatabaseDataResult,
    data: ResultSetDataAction,
    view: ResultSetViewAction,
    edit: ResultSetEditAction,
  ) {
    super(
      source as unknown as IDatabaseDataSource<unknown, IDatabaseResultSet>,
      result as IDatabaseResultSet,
      data,
      view,
      edit as unknown as IDatabaseDataEditAction<unknown, IResultSetValue, IDatabaseDataEditApplyActionData, IDatabaseResultSet>,
    );
  }
}

export type ResultSetSelectAction = ResultSetSelectActionImpl;

export class ResultSetSelectActionDI extends Context.Service<ResultSetSelectActionDI, ResultSetSelectActionImpl>()(
  '@cloudbeaver/plugin-data-viewer/DatabaseDataModel/Actions/ResultSet/ResultSetSelectAction#ResultSetSelectAction',
) {
  static readonly implementation = ResultSetSelectActionImpl;
  static readonly dataFormat = ResultSetSelectActionImpl.dataFormat;
  static readonly dependencies = () =>
    [IDatabaseDataSource, IDatabaseDataResult, ResultSetDataAction, ResultSetViewAction, ResultSetEditAction] as const;
  static readonly make: Effect.Effect<
    ResultSetSelectActionImpl,
    never,
    | Context.Service.Identifier<typeof IDatabaseDataSource>
    | Context.Service.Identifier<typeof IDatabaseDataResult>
    | Context.Service.Identifier<typeof ResultSetDataAction>
    | Context.Service.Identifier<typeof ResultSetViewAction>
    | Context.Service.Identifier<typeof ResultSetEditAction>
  > = Effect.gen(function* makeResultSetSelectAction() {
    const source = yield* IDatabaseDataSource;
    const result = yield* IDatabaseDataResult;
    const data = yield* ResultSetDataAction;
    const view = yield* ResultSetViewAction;
    const edit = yield* ResultSetEditAction;

    return new ResultSetSelectActionImpl(source, result, data, view, edit);
  });
  static readonly layer: Layer.Layer<
    ResultSetSelectActionDI,
    never,
    | Context.Service.Identifier<typeof IDatabaseDataSource>
    | Context.Service.Identifier<typeof IDatabaseDataResult>
    | Context.Service.Identifier<typeof ResultSetDataAction>
    | Context.Service.Identifier<typeof ResultSetViewAction>
    | Context.Service.Identifier<typeof ResultSetEditAction>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const ResultSetSelectAction = ResultSetSelectActionDI;
