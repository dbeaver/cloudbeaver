/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { ResultDataFormat } from '@cloudbeaver/core-sdk';
import {
  DatabaseDataAction,
  GridViewAction,
  IDatabaseDataResult,
  IDatabaseDataSource,
  IDatabaseDataViewAction,
  type IDatabaseResultSet,
  type IGridDataKey,
  type IResultSetGeometryValue,
  isResultSetGeometryValue,
} from '@cloudbeaver/plugin-data-viewer';

import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import type { IDatabaseDataGISAction } from './IDatabaseDataGISAction.js';

export class ResultSetGISActionImpl
  extends DatabaseDataAction<any, IDatabaseResultSet>
  implements IDatabaseDataGISAction<IGridDataKey, IDatabaseResultSet>
{
  static dataFormat = [ResultDataFormat.Resultset];

  private readonly view: GridViewAction;

  constructor(source: IDatabaseDataSource, result: IDatabaseDataResult, view: IDatabaseDataViewAction) {
    super(source as unknown as IDatabaseDataSource<any, IDatabaseResultSet>, result as IDatabaseResultSet);
    this.view = view as GridViewAction;
  }

  isGISFormat(cell: IGridDataKey): boolean {
    const cellHolder = this.view.getCellHolder(cell);

    return isResultSetGeometryValue(cellHolder.value);
  }

  getGISDataFor(cells: IGridDataKey[]): IGridDataKey[] {
    return cells.filter(cell => this.isGISFormat(cell));
  }

  getCellValue(cell: IGridDataKey): IResultSetGeometryValue | undefined {
    const cellHolder = this.view.getCellHolder(cell);

    if (!isResultSetGeometryValue(cellHolder.value)) {
      return undefined;
    }

    return cellHolder.value;
  }
}

export type ResultSetGISAction = ResultSetGISActionImpl;

export class ResultSetGISActionDI extends Context.Service<ResultSetGISActionDI, ResultSetGISActionImpl>()(
  '@cloudbeaver/plugin-gis-viewer/ResultSetGISAction#ResultSetGISAction',
) {
  static readonly implementation = ResultSetGISActionImpl;
  static readonly dataFormat = ResultSetGISActionImpl.dataFormat;
  static readonly dependencies = () => [IDatabaseDataSource, IDatabaseDataResult, IDatabaseDataViewAction] as const;
  static readonly make: Effect.Effect<
    ResultSetGISActionImpl,
    never,
    | Context.Service.Identifier<typeof IDatabaseDataSource>
    | Context.Service.Identifier<typeof IDatabaseDataResult>
    | Context.Service.Identifier<typeof IDatabaseDataViewAction>
  > = Effect.gen(function* makeResultSetGISAction() {
    const source = yield* IDatabaseDataSource;
    const result = yield* IDatabaseDataResult;
    const view = yield* IDatabaseDataViewAction;

    return new ResultSetGISActionImpl(source, result, view);
  });
  static readonly layer: Layer.Layer<
    ResultSetGISActionDI,
    never,
    | Context.Service.Identifier<typeof IDatabaseDataSource>
    | Context.Service.Identifier<typeof IDatabaseDataResult>
    | Context.Service.Identifier<typeof IDatabaseDataViewAction>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const ResultSetGISAction = ResultSetGISActionDI;
