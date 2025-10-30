/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed, makeObservable } from 'mobx';

import { IDatabaseDataSource } from '../../IDatabaseDataSource.js';
import { DatabaseDataResultAction } from '../DatabaseDataResultAction.js';
import type { IGridColumnKey, IGridDataKey, IGridRowKey } from './IGridDataKey.js';
import { GridDataKeysUtils } from './GridDataKeysUtils.js';
import type { IDatabaseDataResult } from '../../IDatabaseDataResult.js';

export abstract class GridDataResultAction<
  TColumn = unknown,
  TRow = unknown,
  TKey extends IGridDataKey = IGridDataKey,
  TCell = unknown,
  TResult extends IDatabaseDataResult = IDatabaseDataResult,
> extends DatabaseDataResultAction<TKey, TResult> {
  abstract get rows(): TRow[];
  abstract get columns(): TColumn[];

  constructor(source: IDatabaseDataSource<any, TResult>, result: TResult) {
    super(source, result);
    makeObservable(this, {
      rows: computed,
      columns: computed,
    });
  }

  getIdentifier(key: TKey): string {
    return GridDataKeysUtils.serialize(key.column);
  }

  serialize(key: TKey): string {
    return GridDataKeysUtils.serializeElementKey(key);
  }

  serializeRowKey(key: IGridRowKey): string {
    return GridDataKeysUtils.serialize(key);
  }

  getDefaultKey(): TKey {
    return {
      row: {
        index: 0,
        subIndex: 0,
      },
      column: {
        index: 0,
      },
    } as TKey;
  }

  abstract insertRow(row: IGridRowKey, value: TCell[], shift?: number): IGridRowKey | undefined;
  abstract removeRow(row: IGridRowKey, shift?: number): IGridRowKey | undefined;
  abstract setRowValue(row: IGridRowKey, value: TCell[], shift?: number): void;
  abstract getRowValue(row: IGridRowKey): TCell[] | undefined;

  findColumnKey(predicate: (column: TColumn) => boolean): IGridColumnKey | undefined {
    const index = this.columns.findIndex(predicate);

    return index === -1 ? undefined : { index };
  }

  getColumn(key: IGridColumnKey): TColumn | undefined {
    if (key.index >= this.columns.length || key.index < 0) {
      return undefined;
    }

    return this.columns[key.index];
  }
}
