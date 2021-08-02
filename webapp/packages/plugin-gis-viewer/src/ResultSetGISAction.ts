/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ResultDataFormat } from '@cloudbeaver/core-sdk';
import { databaseDataAction, IResultSetElementKey, IDatabaseResultSet, DatabaseDataAction } from '@cloudbeaver/plugin-data-viewer';

import type { IDatabaseDataGISAction } from './IDatabaseDataGISAction';

export interface IGISType {
  $type: string;
  srid: number;
  text: string;
  mapText: string | null;
  properties: Record<string, any> | null;
}
@databaseDataAction()
export class ResultSetGISAction extends DatabaseDataAction<any, IDatabaseResultSet>
  implements IDatabaseDataGISAction<IResultSetElementKey, IDatabaseResultSet> {
  private readonly GISValueType = 'geometry';

  static dataFormat = ResultDataFormat.Resultset;

  isGISFormat(cell: IResultSetElementKey): boolean {
    if (cell.row === undefined || cell.column === undefined) {
      return false;
    }

    const value = this.result?.data?.rows?.[cell.row][cell.column];

    if (value !== null && typeof value === 'object' && '$type' in value) {
      return value.$type === this.GISValueType;
    }

    return false;
  }

  getGISDataFor(cells: Array<Required<IResultSetElementKey>>): Array<Required<IResultSetElementKey>> {
    const result: Array<Required<IResultSetElementKey>> = [];
    if (!this.result.data?.rows) {
      return result;
    }

    for (const cell of cells) {
      if (this.isGISFormat(cell)) {
        result.push(cell);
      }
    }
    return result;
  }

  getCellValue(cell: IResultSetElementKey): IGISType | undefined {
    if (cell.row === undefined || cell.column === undefined || !this.result.data?.rows || !this.isGISFormat(cell)) {
      return undefined;
    }

    return this.result.data.rows[cell.row][cell.column];
  }
}
