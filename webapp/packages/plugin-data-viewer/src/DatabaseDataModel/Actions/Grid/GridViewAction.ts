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

interface IColumnRef {
  name: string;
  position: number;
}

function isColumnRef(value: unknown): value is IColumnRef {
  return (
    typeof value === 'object' &&
    value !== null &&
    'name' in value &&
    'position' in value &&
    typeof value.name === 'string' &&
    value.name.length > 0 &&
    typeof value.position === 'number'
  );
}

function isSameRef(left: IColumnRef, right: IColumnRef): boolean {
  return left.name === right.name && left.position === right.position;
}

function refKey(ref: IColumnRef): string {
  return `${ref.name}\0${ref.position}`;
}

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
    const stored = this.readRefs(COLUMN_ORDER_KEY);
    if (stored.length === 0) {
      return this.defaultOrder;
    }
    return this.resolveRefs(stored) ?? this.defaultOrder;
  }

  get pinnedColumns(): ReadonlySet<string> {
    const resolved = this.resolveRefs(this.readRefs(PINNED_COLUMNS_KEY));
    const pinned = new Set<string>();
    if (resolved) {
      for (const index of resolved) {
        pinned.add(GridDataKeysUtils.serialize({ index }));
      }
    }
    return pinned;
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
    const ref = this.getColumnRef(key);
    if (!ref) {
      return;
    }

    const current = this.columnKeys.map(k => this.getColumnRef(k)).filter(isDefined);
    const from = current.findIndex(r => isSameRef(r, ref));
    if (from === -1) {
      return;
    }

    current.splice(from, 1);
    current.splice(index, 0, ref);

    const defaults = this.data.columns.map((_, i) => this.getColumnRef({ index: i })).filter(isDefined);
    const isDefault = isArraysEqual(current, defaults, isSameRef, true);

    this.source.persistedState.set(COLUMN_ORDER_KEY, isDefault ? [] : current);
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
    this.mutatePinned(columns => {
      for (const key of keys) {
        const ref = this.getColumnRef(key);
        if (ref && !columns.some(r => isSameRef(r, ref))) {
          columns.push(ref);
        }
      }
    });
  }

  unpinColumns(keys: IGridColumnKey[]): void {
    this.mutatePinned(columns => {
      for (const key of keys) {
        const ref = this.getColumnRef(key);
        if (!ref) {
          continue;
        }
        const idx = columns.findIndex(r => isSameRef(r, ref));
        if (idx !== -1) {
          columns.splice(idx, 1);
        }
      }
    });
  }

  unpinAllColumns(): void {
    this.source.persistedState.set(PINNED_COLUMNS_KEY, []);
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

    for (const key of [COLUMN_ORDER_KEY, PINNED_COLUMNS_KEY]) {
      const stored = this.readRefs(key);
      if (stored.length > 0 && this.resolveRefs(stored) === null) {
        this.source.persistedState.set(key, []);
      }
    }
  }

  private get defaultOrder(): number[] {
    return this.data.columns.map((_, i) => i);
  }

  private getColumnRef(key: IGridColumnKey): IColumnRef | undefined {
    const name = this.getColumnName(key);
    const column = this.getColumn(key);

    if (!name || typeof column !== 'object' || column === null || !('position' in column) || typeof column.position !== 'number') {
      return undefined;
    }

    return { name, position: column.position };
  }

  private readRefs(key: string): IColumnRef[] {
    const stored = this.source.persistedState.get<unknown>(key);
    if (!Array.isArray(stored)) {
      return [];
    }
    return stored.filter(isColumnRef);
  }

  private mutatePinned(mutate: (columns: IColumnRef[]) => void): void {
    const columns = this.columnKeys
      .filter(key => this.isColumnPinned(key))
      .map(key => this.getColumnRef(key))
      .filter(isDefined);
    mutate(columns);
    this.source.persistedState.set(PINNED_COLUMNS_KEY, columns);
  }

  private resolveRefs(refs: IColumnRef[]): number[] | null {
    if (refs.length === 0) {
      return [];
    }

    const byKey = new Map<string, number[]>();
    for (let i = 0; i < this.data.columns.length; i++) {
      const current = this.getColumnRef({ index: i });
      if (!current) {
        continue;
      }
      const k = refKey(current);
      const list = byKey.get(k);
      if (list) {
        list.push(i);
      } else {
        byKey.set(k, [i]);
      }
    }

    const resolved: number[] = [];
    const used = new Set<number>();

    for (const ref of refs) {
      const candidates = byKey.get(refKey(ref));
      if (!candidates) {
        return null;
      }
      const available = candidates.filter(i => !used.has(i));
      if (available.length !== 1) {
        return null;
      }
      resolved.push(available[0]!);
      used.add(available[0]!);
    }

    return resolved;
  }
}
