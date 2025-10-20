/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
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

import type { IDatabaseDataGISAction } from './IDatabaseDataGISAction.js';
import { injectable } from '@cloudbeaver/core-di';

@injectable(() => [IDatabaseDataSource, IDatabaseDataResult, IDatabaseDataViewAction])
export class ResultSetGISAction
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
