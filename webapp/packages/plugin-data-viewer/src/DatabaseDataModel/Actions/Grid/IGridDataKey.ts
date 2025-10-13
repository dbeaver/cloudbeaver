/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export interface IGridColumnKey {
  index: number;
}

export interface IGridRowKey {
  index: number;
  subIndex: number;
}

export interface IGridDataKey<TRow = IGridRowKey, TColumn = IGridColumnKey> {
  readonly row: TRow;
  readonly column: TColumn;
}
