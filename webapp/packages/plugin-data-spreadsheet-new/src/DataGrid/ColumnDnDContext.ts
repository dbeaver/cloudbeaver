/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createContext } from 'react';
import type { ColumnDropSide } from './getDropSide.js';

export interface IColumnDnDState {
  dropTargetColumnIndex: number | null;
  dropSide: ColumnDropSide;
  isDragging: boolean;
  setDropTarget(columnIndex: number | null, side?: ColumnDropSide): void;
  setDragging(isDragging: boolean): void;
}

export const ColumnDnDContext = createContext<IColumnDnDState | null>(null);
