/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed, makeObservable } from 'mobx';

import { DataTypeLogicalOperation, ResultDataFormat, SqlResultColumn } from '@cloudbeaver/core-sdk';

import { DatabaseDataAction } from '../../DatabaseDataAction';
import type { IDatabaseDataSource } from '../../IDatabaseDataSource';
import type { IDatabaseResultSet } from '../../IDatabaseResultSet';
import { databaseDataAction } from '../DatabaseDataActionDecorator';
import type { IDatabaseDataResultAction } from '../IDatabaseDataResultAction';
import type { IResultSetContentValue } from './IResultSetContentValue';
import type { IResultSetElementKey } from './IResultSetElementKey';
import { isResultSetContentValue } from './isResultSetContentValue';
import type { IResultSetValue } from './ResultSetFormatAction';

@databaseDataAction()
export class ResultSetDataAction extends DatabaseDataAction<any, IDatabaseResultSet>
  implements IDatabaseDataResultAction<IDatabaseResultSet> {
  static dataFormat = ResultDataFormat.Resultset;

  get rows(): IResultSetValue[][] {
    return this.result.data?.rows || [];
  }

  get columns(): SqlResultColumn[] {
    return this.result.data?.columns || [];
  }

  constructor(source: IDatabaseDataSource<any, IDatabaseResultSet>, result: IDatabaseResultSet) {
    super(source, result);
    makeObservable(this, {
      rows: computed,
      columns: computed,
    });
  }

  getCellValue(cell: IResultSetElementKey): IResultSetValue | undefined {
    if (
      cell.row === undefined
      || cell.column === undefined
      || cell.row >= this.rows.length
      || cell.column >= this.columns.length
    ) {
      return undefined;
    }

    return this.rows[cell.row][cell.column];
  }

  getContent(cell: IResultSetElementKey): IResultSetContentValue | null {
    const value = this.getCellValue(cell);

    if (isResultSetContentValue(value)) {
      return value;
    }

    return null;
  }

  getColumn(columnIndex: number): SqlResultColumn | undefined {
    if (columnIndex >= this.columns.length) {
      return undefined;
    }

    return this.columns[columnIndex];
  }

  getColumnOperations(columnIndex: number): DataTypeLogicalOperation[] {
    const column = this.getColumn(columnIndex);

    if (!column) {
      return [];
    }

    return column.supportedOperations
      .filter(operation => operation.argumentCount === 1 || operation.argumentCount === 0);
  }
}
