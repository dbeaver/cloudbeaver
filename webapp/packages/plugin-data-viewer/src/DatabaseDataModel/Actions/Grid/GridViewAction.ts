/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, computed, makeObservable, observable, ObservableSet } from 'mobx';

import { DatabaseDataAction } from '../../DatabaseDataAction.js';
import { IDatabaseDataSource } from '../../IDatabaseDataSource.js';
import type { IGridColumnKey, IGridDataKey, IGridRowKey } from './IGridDataKey.js';
import { IDatabaseDataResult } from '../../IDatabaseDataResult.js';
import { compareGridRowKeys } from './compareGridRowKeys.js';
import { GridDataResultAction } from './GridDataResultAction.js';
import { GridEditAction } from './GridEditAction.js';
import { GridDataKeysUtils } from './GridDataKeysUtils.js';
import type { ResultDataFormat } from '@cloudbeaver/core-sdk';
import { injectable } from '@cloudbeaver/core-di';
import type { IDatabaseDataViewAction } from '../IDatabaseDataViewAction.js';
import { IDatabaseDataResultAction } from '../IDatabaseDataResultAction.js';
import { IDatabaseDataEditAction } from '../IDatabaseDataEditAction.js';
import type { IDatabaseValueHolder } from '../IDatabaseValueHolder.js';

@injectable(() => [IDatabaseDataSource, IDatabaseDataResult, IDatabaseDataResultAction, IDatabaseDataEditAction])
export class GridViewAction<
  TColumn = unknown,
  TRow = unknown,
  TKey extends IGridDataKey = IGridDataKey,
  TCell = unknown,
  TResult extends IDatabaseDataResult = IDatabaseDataResult,
>
  extends DatabaseDataAction<any, TResult>
  implements IDatabaseDataViewAction<TKey, TCell, TResult>
{
  static dataFormat: ResultDataFormat[] | null = null;

  get rowKeys(): IGridRowKey[] {
    return [...(this.editor?.addRows || []), ...this.data.rows.map((c, index) => ({ index, subIndex: 0 }))].sort(compareGridRowKeys);
  }

  get columnKeys(): IGridColumnKey[] {
    return this.columnsOrder.map(index => ({ index }));
  }

  get rows(): TCell[][] {
    return this.rowKeys.map(this.mapRow, this);
  }

  get columns(): TColumn[] {
    return this.columnKeys.map(this.mapColumn, this);
  }

  private columnsOrder: number[];
  readonly pinnedColumns: ObservableSet<string>;
  protected readonly data: GridDataResultAction<TColumn, TRow, TKey, TCell, TResult>;
  protected readonly editor?: GridEditAction<TColumn, TRow, TKey, TCell, TResult>;

  constructor(
    source: IDatabaseDataSource<any, TResult>,
    result: TResult,
    data: IDatabaseDataResultAction<TKey, TResult>,
    editor?: IDatabaseDataEditAction,
  ) {
    super(source, result);
    this.data = data as GridDataResultAction<TColumn, TRow, TKey, TCell, TResult>;
    this.editor = editor as GridEditAction<TColumn, TRow, TKey, TCell, TResult> | undefined;
    this.columnsOrder = this.data.columns.map((key, index) => index);
    this.pinnedColumns = observable.set<string>();

    makeObservable<this, 'columnsOrder' | 'pinnedColumns'>(this, {
      columnsOrder: observable,
      pinnedColumns: observable,
      setColumnOrder: action,
      pinColumn: action,
      unpinColumn: action,
      unpinAllColumns: action,
      rows: computed,
      rowKeys: computed,
      columns: computed,
      columnKeys: computed,
    });
  }

  has(cell: TKey): boolean {
    if (!this.hasColumn(cell.column)) {
      return false;
    }

    return this.hasRow(cell.row);
  }

  hasRow(key: IGridRowKey): boolean {
    return this.rowIndex(key) !== -1;
  }

  hasColumn(key: IGridColumnKey): boolean {
    return this.columnIndex(key) !== -1;
  }

  rowIndex(key: IGridRowKey): number {
    return this.rowKeys.findIndex(row => GridDataKeysUtils.isEqual(row, key));
  }

  setColumnOrder(key: IGridColumnKey, index: number): void {
    const columnIndex = this.columnDataIndex(key);

    if (columnIndex === -1) {
      return;
    }

    this.columnsOrder.splice(this.columnsOrder.indexOf(columnIndex), 1);
    this.columnsOrder.splice(index, 0, columnIndex);
  }

  columnIndex(key: IGridColumnKey): number {
    return this.columnKeys.findIndex(column => GridDataKeysUtils.isEqual(column, key));
  }

  columnDataIndex(key: IGridColumnKey): number {
    return this.data.columns.findIndex((column, index) => GridDataKeysUtils.isEqual({ index }, key));
  }

  nextKey(key: IGridDataKey): IGridDataKey | null {
    let row: IGridRowKey | undefined = key.row;
    let column: IGridColumnKey | undefined = key.column;

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

  get(key: TKey): IDatabaseValueHolder<TKey, TCell> | undefined {
    if (!this.has(key)) {
      return undefined;
    }

    return this.getCellHolder(key);
  }

  getRow(row: IGridRowKey): TCell[] {
    return this.mapRow(row);
  }

  getCellHolder(cell: TKey): IDatabaseValueHolder<TKey, TCell> {
    if (cell.column.index < 0 || cell.column.index >= this.data.columns.length) {
      throw new Error('Cell is out of range');
    }

    return { value: this.mapRow(cell.row)[cell.column.index]!, key: cell };
  }

  getColumn(key: IGridColumnKey): TColumn | undefined {
    return this.mapColumn(key);
  }

  getColumnName(key: IGridColumnKey): string | undefined {
    return this.data.getColumnName(key);
  }

  pinColumn(key: IGridColumnKey): void {
    const serializedKey = GridDataKeysUtils.serialize(key);
    this.pinnedColumns.add(serializedKey);
  }

  unpinColumn(key: IGridColumnKey): void {
    const serializedKey = GridDataKeysUtils.serialize(key);
    this.pinnedColumns.delete(serializedKey);
  }

  unpinAllColumns(): void {
    this.pinnedColumns.clear();
  }

  isColumnPinned(key: IGridColumnKey): boolean {
    const serializedKey = GridDataKeysUtils.serialize(key);
    return this.pinnedColumns.has(serializedKey);
  }

  hasPinnedColumns(): boolean {
    return this.pinnedColumns.size > 0;
  }

  protected mapRow(row: IGridRowKey): TCell[] {
    const edited = this.editor?.getRow(row);

    if (edited !== undefined) {
      return edited;
    }

    if (row.index < 0 || row.index >= this.data.rows.length) {
      throw new Error('Row is out of range');
    }

    return this.data.getRowValue(row)!;
  }

  protected mapColumn(key: IGridColumnKey): TColumn {
    if (key.index < 0 || key.index >= this.data.columns.length) {
      throw new Error('Column is out of range');
    }
    return this.data.getColumn(key)!;
  }

  override updateResult(result: TResult, index: number): void {
    super.updateResult(result, index);
    if (this.columnsOrder.length !== this.data.columns.length) {
      this.columnsOrder = this.data.columns.map((key, index) => index);
    }
  }
}
