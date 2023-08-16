/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
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
  IResultSetElementKey,
  ResultSetViewAction,
} from '@cloudbeaver/plugin-data-viewer';

import type { IDatabaseDataGISAction } from './IDatabaseDataGISAction';

export interface IGISType {
  $type: string;
  srid: number;
  text: string;
  mapText: string | null;
  properties: Record<string, any> | null;
}
@databaseDataAction()
export class ResultSetGISAction
  extends DatabaseDataAction<any, IDatabaseResultSet>
  implements IDatabaseDataGISAction<IResultSetElementKey, IDatabaseResultSet>
{
  private readonly GISValueType = 'geometry';

  static dataFormat = [ResultDataFormat.Resultset];

  private readonly view: ResultSetViewAction;

  constructor(source: IDatabaseDataSource<any, IDatabaseResultSet>, view: ResultSetViewAction) {
    super(source);
    this.view = view;
  }

  isGISFormat(cell: IResultSetElementKey): boolean {
    const value = this.view.getCellValue(cell);

    if (value !== null && typeof value === 'object' && '$type' in value) {
      return value.$type === this.GISValueType;
    }

    return false;
  }

  getGISDataFor(cells: IResultSetElementKey[]): IResultSetElementKey[] {
    return cells.filter(cell => this.isGISFormat(cell));
  }

  getCellValue(cell: IResultSetElementKey): IGISType | undefined {
    if (!this.isGISFormat(cell)) {
      return undefined;
    }

    return this.view.getCellValue(cell) as any as IGISType;
  }
}
