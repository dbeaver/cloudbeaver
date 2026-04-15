/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, computed, makeObservable } from 'mobx';

import { isArraysEqual } from '@cloudbeaver/core-utils';
import { isDefined } from '@dbeaver/js-helpers';
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

const PINNED_COLUMNS_KEY = 'pinnedColumns';
const COLUMN_ORDER_KEY = 'columnOrder';

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

  get columnsOrder(): number[] {
    const columns = this.data.columns;
    const names = this.source.persistedState.get<string[]>(COLUMN_ORDER_KEY);

    if (!names?.length) {
      return columns.map((_, i) => i);
    }

    const nameToIndex = new Map<string, number>();
    for (let i = 0; i < columns.length; i++) {
      const name = this.getColumnName({ index: i });
      if (name !== undefined) {
        nameToIndex.set(name, i);
      }
    }

    const order: number[] = [];
    const used = new Set<number>();
    for (const name of names) {
      const idx = nameToIndex.get(name);
      if (idx !== undefined && !used.has(idx)) {
        order.push(idx);
        used.add(idx);
      }
    }
    for (let i = 0; i < columns.length; i++) {
      if (!used.has(i)) {
        order.push(i);
      }
    }
    return order;
  }

  get pinnedColumns(): ReadonlySet<string> {
    const names = this.source.persistedState.get<string[]>(PINNED_COLUMNS_KEY);
    const result = new Set<string>();

    if (!names?.length) {
      return result;
    }

    const nameSet = new Set(names);
    for (let i = 0; i < this.data.columns.length; i++) {
      const key: IGridColumnKey = { index: i };
      const name = this.getColumnName(key);
      if (name !== undefined && nameSet.has(name)) {
        result.add(GridDataKeysUtils.serialize(key));
      }
    }
    return result;
  }

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

    makeObservable(this, {
      columnsOrder: computed,
      pinnedColumns: computed,
      setColumnOrder: action,
      pinColumns: action,
      unpinColumns: action,
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
    const columnName = this.getColumnName(key);
    if (columnName === undefined) {
      return;
    }

    const currentNames = this.columnKeys.map(k => this.getColumnName(k)).filter(isDefined);

    const fromIdx = currentNames.indexOf(columnName);
    if (fromIdx === -1) {
      return;
    }

    currentNames.splice(fromIdx, 1);
    currentNames.splice(index, 0, columnName);

    const defaultNames = this.data.columns.map((_, i) => this.getColumnName({ index: i })).filter(isDefined);
    const isDefaultOrder = isArraysEqual(currentNames, defaultNames, undefined, true);

    this.source.persistedState.set(COLUMN_ORDER_KEY, isDefaultOrder ? [] : currentNames);
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

  pinColumns(keys: IGridColumnKey[]): void {
    this.mutatePinned(names => {
      for (const key of keys) {
        const name = this.getColumnName(key);
        if (name !== undefined) {
          names.add(name);
        }
      }
    });
  }

  unpinColumns(keys: IGridColumnKey[]): void {
    this.mutatePinned(names => {
      for (const key of keys) {
        const name = this.getColumnName(key);
        if (name !== undefined) {
          names.delete(name);
        }
      }
    });
  }

  unpinAllColumns(): void {
    this.source.persistedState.set(PINNED_COLUMNS_KEY, []);
  }

  private mutatePinned(mutate: (names: Set<string>) => void): void {
    const ps = this.source.persistedState;
    const names = new Set(ps.get<string[]>(PINNED_COLUMNS_KEY) ?? []);
    mutate(names);
    ps.set(PINNED_COLUMNS_KEY, [...names]);
  }

  isColumnPinned(key: IGridColumnKey): boolean {
    return this.pinnedColumns.has(GridDataKeysUtils.serialize(key));
  }

  hasPinnedColumns(): boolean {
    return this.pinnedColumns.size > 0;
  }

  getPinnedColumnNames(): string[] {
    return this.columnKeys
      .filter(key => this.isColumnPinned(key))
      .map(key => this.getColumnName(key))
      .filter(isDefined);
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

    if (this.data.columns.length === 0) {
      return;
    }

    const ps = this.source.persistedState;
    const orderNames = ps.get<string[]>(COLUMN_ORDER_KEY);
    const pinnedNames = ps.get<string[]>(PINNED_COLUMNS_KEY);

    if (!orderNames?.length && !pinnedNames?.length) {
      return;
    }

    const validNames = new Set<string>();
    for (let i = 0; i < this.data.columns.length; i++) {
      const name = this.getColumnName({ index: i });
      if (name !== undefined) {
        validNames.add(name);
      }
    }

    const cleanStoredNames = (key: string, stored: string[] | undefined) => {
      if (!stored?.length) {
        return;
      }
      const cleaned = stored.filter(n => validNames.has(n));
      if (cleaned.length !== stored.length) {
        ps.set(key, cleaned);
      }
    };

    cleanStoredNames(COLUMN_ORDER_KEY, orderNames);
    cleanStoredNames(PINNED_COLUMNS_KEY, pinnedNames);
  }
}
