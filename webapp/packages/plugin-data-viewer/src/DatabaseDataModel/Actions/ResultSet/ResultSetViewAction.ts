/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, makeObservable, observable } from 'mobx';

import { DataTypeLogicalOperation, ResultDataFormat, SqlResultColumn } from '@cloudbeaver/core-sdk';

import { DatabaseDataAction } from '../../DatabaseDataAction';
import type { IDatabaseDataSource } from '../../IDatabaseDataSource';
import type { IDatabaseResultSet } from '../../IDatabaseResultSet';
import { databaseDataAction } from '../DatabaseDataActionDecorator';
import type { IDatabaseDataResultAction } from '../IDatabaseDataResultAction';
import { compareResultSetRowKeys } from './compareResultSetRowKeys';
import type { IResultSetComplexValue } from './IResultSetComplexValue';
import type { IResultSetColumnKey, IResultSetElementKey, IResultSetRowKey } from './IResultSetDataKey';
import { isResultSetContentValue } from './isResultSetContentValue';
import { ResultSetDataAction } from './ResultSetDataAction';
import { ResultSetDataKeysUtils } from './ResultSetDataKeysUtils';
import { ResultSetEditAction } from './ResultSetEditAction';
import type { IResultSetValue } from './ResultSetFormatAction';

@databaseDataAction()
export class ResultSetViewAction extends DatabaseDataAction<any, IDatabaseResultSet> implements IDatabaseDataResultAction<IDatabaseResultSet> {
  static dataFormat = [ResultDataFormat.Resultset];

  get rowKeys(): IResultSetRowKey[] {
    return [...this.editor.addRows, ...this.data.rows.map((c, index) => ({ index, subIndex: 0 }))].sort(compareResultSetRowKeys);
  }

  get columnKeys(): IResultSetColumnKey[] {
    return this.columns.map(c => ({ index: this.data.columns.indexOf(c) }));
  }

  get rows(): IResultSetValue[][] {
    return this.data.rows;
  }

  get columns(): SqlResultColumn[] {
    return this.columnsOrder.map(i => this.data.columns[i]);
  }

  private columnsOrder: number[] = [];
  private readonly data: ResultSetDataAction;
  private readonly editor: ResultSetEditAction;

  constructor(source: IDatabaseDataSource<any, IDatabaseResultSet>, data: ResultSetDataAction, editor: ResultSetEditAction) {
    super(source);
    this.data = data;
    this.editor = editor;

    makeObservable<this, 'columnsOrder'>(this, {
      columnsOrder: observable,
      setColumnOrder: action,
    });
  }

  has(cell: IResultSetElementKey): boolean {
    if (!this.hasColumn(cell.column)) {
      return false;
    }

    return this.hasRow(cell.row);
  }

  hasRow(key: IResultSetRowKey): boolean {
    return this.rowIndex(key) !== -1;
  }

  hasColumn(key: IResultSetColumnKey): boolean {
    return this.columnIndex(key) !== -1;
  }

  rowIndex(key: IResultSetRowKey): number {
    return this.rowKeys.findIndex(row => ResultSetDataKeysUtils.isEqual(row, key));
  }

  setColumnOrder(key: IResultSetColumnKey, index: number): void {
    const columnIndex = this.columnDataIndex(key);

    if (columnIndex === -1) {
      return;
    }

    this.columnsOrder.splice(this.columnsOrder.indexOf(columnIndex), 1);
    this.columnsOrder.splice(index, 0, columnIndex);
  }

  columnIndex(key: IResultSetColumnKey): number {
    return this.columnKeys.findIndex(column => ResultSetDataKeysUtils.isEqual(column, key));
  }

  columnDataIndex(key: IResultSetColumnKey): number {
    return this.data.columns.findIndex((column, index) => ResultSetDataKeysUtils.isEqual({ index }, key));
  }

  nextKey(key: IResultSetElementKey): IResultSetElementKey | null {
    let row: IResultSetRowKey | undefined = key.row;
    let column: IResultSetColumnKey | undefined = key.column;

    const rowKeyIndex = this.rowIndex(row);
    const columnKeyIndex = this.columnIndex(column);

    if (rowKeyIndex === -1 && row) {
      row = this.rowKeys.find(key => key.index >= row!.index);

      if (!row && this.rowKeys.length > 0) {
        row = this.rowKeys[this.rowKeys.length - 1];
      }
    }
    if (columnKeyIndex === -1 && column) {
      column = this.columnKeys.find(key => key.index >= column!.index);

      if (!column && this.columnKeys.length > 0) {
        column = this.columnKeys[this.columnKeys.length - 1];
      }
    }

    if (!row || !column) {
      return null;
    }

    return { row, column };
  }

  getCellValue(cell: IResultSetElementKey): IResultSetValue {
    const edited = this.editor.get(cell);

    if (edited !== undefined) {
      return edited;
    }

    if (cell.row.index >= this.rows.length || cell.column.index >= this.columns.length) {
      throw new Error('Cell is out of range');
    }

    return this.rows[cell.row.index][cell.column.index];
  }

  getContent(cell: IResultSetElementKey): IResultSetComplexValue | null {
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

    return column.supportedOperations.filter(operation => operation.argumentCount === 1 || operation.argumentCount === 0);
  }

  updateResult(result: IDatabaseResultSet, index: number): void {
    super.updateResult(result, index);
    if (this.columnsOrder.length !== this.data.columns.length) {
      this.columnsOrder = this.data.columns.map((key, index) => index);
    }
  }
}
