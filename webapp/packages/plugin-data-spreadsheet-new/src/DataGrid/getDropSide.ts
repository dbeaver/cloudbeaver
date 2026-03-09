/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IColumnDnDState } from './ColumnDnDContext.js';
import type { IColumnInfo } from './TableDataContext.js';

export type ColumnDropSide = 'left' | 'right' | null;

export function getDropSide(columnInfo: IColumnInfo | undefined, columnDnDContext: IColumnDnDState | null): ColumnDropSide {
  if (columnInfo?.key !== null && columnDnDContext?.dropTargetColumnIndex === columnInfo?.key.index && columnDnDContext?.isDragging) {
    return columnDnDContext.dropSide;
  }
  return null;
}
