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

interface IGridStoredColumnReference {
  name: string;
  position: number;
}

interface IResolvedLayoutState {
  valid: boolean;
  hasState: boolean;
  columnOrder: number[];
  pinnedColumns: ReadonlySet<string>;
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
    return this.getResolvedLayoutState().columnOrder;
  }

  get pinnedColumns(): ReadonlySet<string> {
    return this.getResolvedLayoutState().pinnedColumns;
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
    const columnRef = this.getStoredColumnReference(key);
    if (columnRef === undefined) {
      return;
    }

    const currentOrder = this.getCurrentColumnReferences();

    const fromIdx = currentOrder.findIndex(ref => this.isSameStoredColumnReference(ref, columnRef));
    if (fromIdx === -1) {
      return;
    }

    currentOrder.splice(fromIdx, 1);
    currentOrder.splice(index, 0, columnRef);

    const defaultOrder = this.getDefaultColumnReferences();
    const isDefaultOrder = isArraysEqual(currentOrder, defaultOrder, (left, right) => this.isSameStoredColumnReference(left, right), true);

    this.source.persistedState.set(COLUMN_ORDER_KEY, isDefaultOrder ? [] : currentOrder);
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
        const column = this.getStoredColumnReference(key);
        if (column !== undefined && !columns.some(ref => this.isSameStoredColumnReference(ref, column))) {
          columns.push(column);
        }
      }
    });
  }

  unpinColumns(keys: IGridColumnKey[]): void {
    this.mutatePinned(columns => {
      for (const key of keys) {
        const column = this.getStoredColumnReference(key);
        if (column !== undefined) {
          const index = columns.findIndex(ref => this.isSameStoredColumnReference(ref, column));

          if (index !== -1) {
            columns.splice(index, 1);
          }
        }
      }
    });
  }

  unpinAllColumns(): void {
    this.source.persistedState.set(PINNED_COLUMNS_KEY, []);
  }

  protected getStoredColumnReference(key: IGridColumnKey): IGridStoredColumnReference | undefined {
    const name = this.getColumnName(key);
    const column = this.getColumn(key);

    if (!name || typeof column !== 'object' || column === null || !('position' in column) || typeof column.position !== 'number') {
      return undefined;
    }

    return {
      name,
      position: column.position,
    };
  }

  protected isStoredColumnReference(reference: unknown): reference is IGridStoredColumnReference {
    return (
      typeof reference === 'object' &&
      reference !== null &&
      'name' in reference &&
      'position' in reference &&
      typeof reference.name === 'string' &&
      reference.name.length > 0 &&
      typeof reference.position === 'number'
    );
  }

  protected isSameStoredColumnReference(left: unknown, right: unknown): boolean {
    if (!this.isStoredColumnReference(left) || !this.isStoredColumnReference(right)) {
      return false;
    }

    return left.name === right.name && left.position === right.position;
  }

  protected resolveStoredColumnReference(reference: unknown, used: Set<number>): number | undefined {
    if (!this.isStoredColumnReference(reference)) {
      return undefined;
    }

    let match: number | undefined;

    for (let i = 0; i < this.data.columns.length; i++) {
      if (used.has(i)) {
        continue;
      }

      const current = this.getStoredColumnReference({ index: i });

      if (!current) {
        continue;
      }

      if (!this.isSameStoredColumnReference(current, reference)) {
        continue;
      }

      if (match !== undefined) {
        return undefined;
      }

      match = i;
    }

    return match;
  }

  private mutatePinned(mutate: (columns: unknown[]) => void): void {
    const columns = this.getCurrentPinnedReferences();
    mutate(columns);
    this.source.persistedState.set(PINNED_COLUMNS_KEY, columns);
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

    const layout = this.getResolvedLayoutState();

    if (!layout.hasState || layout.valid) {
      return;
    }

    this.source.persistedState.set(COLUMN_ORDER_KEY, []);
    this.source.persistedState.set(PINNED_COLUMNS_KEY, []);
  }

  private getResolvedLayoutState(): IResolvedLayoutState {
    const defaultOrder = this.data.columns.map((_, i) => i);
    const emptyPins = new Set<string>();
    const orderRefs = this.readStoredColumnReferences(COLUMN_ORDER_KEY);
    const pinnedRefs = this.readStoredColumnReferences(PINNED_COLUMNS_KEY);

    if (orderRefs === null || pinnedRefs === null) {
      return {
        valid: false,
        hasState: true,
        columnOrder: defaultOrder,
        pinnedColumns: emptyPins,
      };
    }

    if (!orderRefs?.length && !pinnedRefs?.length) {
      return {
        valid: true,
        hasState: false,
        columnOrder: defaultOrder,
        pinnedColumns: emptyPins,
      };
    }

    const order = this.resolveStoredColumnReferences(orderRefs ?? []);
    const pinned = this.resolveStoredColumnReferences(pinnedRefs ?? []);

    if (order === null || pinned === null) {
      return {
        valid: false,
        hasState: true,
        columnOrder: defaultOrder,
        pinnedColumns: emptyPins,
      };
    }

    return {
      valid: true,
      hasState: true,
      columnOrder: orderRefs?.length ? order : defaultOrder,
      pinnedColumns: this.serializePinnedColumns(pinned),
    };
  }

  private readStoredColumnReferences(key: string): unknown[] | undefined | null {
    const stored = this.source.persistedState.get<unknown>(key);

    if (stored === undefined) {
      return undefined;
    }

    if (!Array.isArray(stored)) {
      return null;
    }

    return stored;
  }

  private resolveStoredColumnReferences(references: unknown[]): number[] | null {
    const resolved: number[] = [];
    const used = new Set<number>();

    for (const reference of references) {
      const columnIndex = this.resolveStoredColumnReference(reference, used);

      if (columnIndex === undefined) {
        return null;
      }

      resolved.push(columnIndex);
      used.add(columnIndex);
    }

    return resolved;
  }

  private getCurrentColumnReferences(): unknown[] {
    return this.columnKeys.map(key => this.getStoredColumnReference(key)).filter(isDefined);
  }

  private getDefaultColumnReferences(): unknown[] {
    return this.data.columns.map((_, i) => this.getStoredColumnReference({ index: i })).filter(isDefined);
  }

  private getCurrentPinnedReferences(): unknown[] {
    return this.columnKeys
      .filter(key => this.isColumnPinned(key))
      .map(key => this.getStoredColumnReference(key))
      .filter(isDefined);
  }

  private serializePinnedColumns(columns: number[]): ReadonlySet<string> {
    const pinned = new Set<string>();

    for (const index of columns) {
      pinned.add(GridDataKeysUtils.serialize({ index }));
    }

    return pinned;
  }
}
