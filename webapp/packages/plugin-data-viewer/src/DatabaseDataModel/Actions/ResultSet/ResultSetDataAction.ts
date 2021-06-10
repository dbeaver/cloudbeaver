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
import type { IDatabaseDataResultAction } from '../IDatabaseDataResultAction';
import type { IResultSetContentValue } from './IResultSetContentValue';
import type { IResultSetElementKey } from './IResultSetElementKey';
import { isResultSetContentValue } from './isResultSetContentValue';

@databaseDataAction()
export class ResultSetDataAction extends DatabaseDataAction<any, IDatabaseResultSet>
  implements IDatabaseDataResultAction<IDatabaseResultSet> {
  static dataFormat = ResultDataFormat.Resultset;

  getCellValue(cell: IResultSetElementKey): any {
    if (cell.row === undefined || cell.column === undefined || !this.result.data?.rows) {
      return undefined;
    }

    return this.result.data.rows?.[cell.row]?.[cell.column];
  }

  getContent(cell: IResultSetElementKey): IResultSetContentValue | null {
    const value = this.getCellValue(cell);

    if (isResultSetContentValue(value)) {
      return value;
    }

    return null;
  }

  getColumn(columnIndex: number) {
    if (!this.result.data?.columns) {
      return undefined;
    }

    return this.result.data.columns[columnIndex];
  }

  getColumnOperations(columnIndex: number) {
    const column = this.getColumn(columnIndex);
    if (!column) {
      return [];
    }

    return column.supportedOperations
      .filter(operation => operation.argumentCount === 1 || operation.argumentCount === 0);
  }
}
