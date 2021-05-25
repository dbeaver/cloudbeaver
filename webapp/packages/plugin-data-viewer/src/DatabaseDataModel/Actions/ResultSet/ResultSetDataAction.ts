/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ResultDataFormat } from '@cloudbeaver/core-sdk';

import { DatabaseDataAction } from '../../DatabaseDataAction';
import type { IDatabaseResultSet } from '../../IDatabaseResultSet';
import { databaseDataAction } from '../DatabaseDataActionDecorator';
import type { IDatabaseResultDataAction } from '../IDatabaseDataAction';
import type { IResultSetElementKey } from './IResultSetElementKey';

@databaseDataAction()
export class ResultSetDataAction extends DatabaseDataAction<any, IDatabaseResultSet>
  implements IDatabaseResultDataAction<IResultSetElementKey, IDatabaseResultSet> {
  static dataFormat = ResultDataFormat.Resultset;

  getCellValue(cell: IResultSetElementKey): any {
    if (cell.row === undefined || cell.column === undefined || !this.result.data?.rows) {
      return undefined;
    }

    return this.result.data.rows?.[cell.row]?.[cell.column];
  }

  getColumn(columnIndex: number) {
    if (!this.result.data?.columns) {
      return undefined;
    }

    return this.result.data.columns[columnIndex];
  }
}
