/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { ResultDataFormat } from '@cloudbeaver/core-sdk';
import {
  databaseDataAction,
  DatabaseDataAction,
  type IDatabaseDataSource,
  type IDatabaseResultSet,
  type IResultSetElementKey,
  type IResultSetGeometryValue,
  isResultSetGeometryValue,
  ResultSetViewAction,
} from '@cloudbeaver/plugin-data-viewer';

import type { IDatabaseDataGISAction } from './IDatabaseDataGISAction.js';

@databaseDataAction()
export class ResultSetGISAction
  extends DatabaseDataAction<any, IDatabaseResultSet>
  implements IDatabaseDataGISAction<IResultSetElementKey, IDatabaseResultSet>
{
  static dataFormat = [ResultDataFormat.Resultset];

  private readonly view: ResultSetViewAction;

  constructor(source: IDatabaseDataSource<any, IDatabaseResultSet>, view: ResultSetViewAction) {
    super(source);
    this.view = view;
  }

  isGISFormat(cell: IResultSetElementKey): boolean {
    const value = this.view.getCellValue(cell);

    return isResultSetGeometryValue(value);
  }

  getGISDataFor(cells: IResultSetElementKey[]): IResultSetElementKey[] {
    return cells.filter(cell => this.isGISFormat(cell));
  }

  getCellValue(cell: IResultSetElementKey): IResultSetGeometryValue | undefined {
    const value = this.view.getCellValue(cell);

    if (!isResultSetGeometryValue(value)) {
      return undefined;
    }

    return value;
  }
}
