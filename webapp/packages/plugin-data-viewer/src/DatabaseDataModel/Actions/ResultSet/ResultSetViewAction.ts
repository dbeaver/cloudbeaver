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
import type { IResultSetColumnKey, IResultSetElementKey, IResultSetRowKey } from './IResultSetDataKey';
import { isResultSetContentValue } from './isResultSetContentValue';
import { ResultSetDataAction } from './ResultSetDataAction';
import { ResultSetDataKeysUtils } from './ResultSetDataKeysUtils';
import { ResultSetEditAction } from './ResultSetEditAction';
import type { IResultSetValue } from './ResultSetFormatAction';

@databaseDataAction()
export class ResultSetViewAction extends DatabaseDataAction<any, IDatabaseResultSet>
  implements IDatabaseDataResultAction<IDatabaseResultSet> {
  static dataFormat = ResultDataFormat.Resultset;

  get rowKeys(): IResultSetRowKey[] {
    const rows = this.data.rows
      .map((c, index) => ({ index }));

    rows.push(...this.editor.addRows);
    rows.sort((a, b) => a.index - b.index);
    return rows;
  }

  get columnKeys(): IResultSetColumnKey[] {
    return this.data.columns.map((c, index) => ({ index }));
  }

  get rows(): IResultSetValue[][] {
    return this.result.data?.rows || [];
  }

  get columns(): SqlResultColumn[] {
    return this.result.data?.columns || [];
  }

  private data: ResultSetDataAction;
  private editor: ResultSetEditAction;

  constructor(source: IDatabaseDataSource<any, IDatabaseResultSet>, result: IDatabaseResultSet) {
    super(source, result);
    this.data = this.getAction(ResultSetDataAction);
    this.editor = this.getAction(ResultSetEditAction);

    makeObservable(this, {
      rows: computed,
      columns: computed,
    });
  }

  has(cell: IResultSetElementKey): boolean {
    if (!this.columnKeys.some(column => ResultSetDataKeysUtils.isEqual(column, cell.column))) {
      return false;
    }

    return !this.rowKeys.some(row => ResultSetDataKeysUtils.isEqual(row, cell.row));
  }

  getCellValue(cell: IResultSetElementKey): IResultSetValue | undefined {
    if (
      cell.row.index >= this.rows.length
      || cell.column.index >= this.columns.length
    ) {
      return undefined;
    }

    const edited = this.editor.get(cell);

    if (edited !== undefined) {
      return edited;
    }

    return this.rows[cell.row.index][cell.column.index];
  }

  getContent(cell: IResultSetElementKey): IResultSetContentValue | null {
    const value = this.getCellValue(cell);

    if (isResultSetContentValue(value)) {
      return value;
    }

    return null;
  }

  getColumn(key: IResultSetColumnKey): SqlResultColumn | undefined {
    if (key.index >= this.columns.length) {
      return undefined;
    }

    return this.columns[key.index];
  }

  getColumnOperations(key: IResultSetColumnKey): DataTypeLogicalOperation[] {
    const column = this.getColumn(key);

    if (!column) {
      return [];
    }

    return column.supportedOperations
      .filter(operation => operation.argumentCount === 1 || operation.argumentCount === 0);
  }
}
