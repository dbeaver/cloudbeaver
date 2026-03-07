/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createContext } from 'react';

export interface IColumnDnDState {
  dropTargetColumnIndex: number | null;
  isDragging: boolean;
  setDropTarget(columnIndex: number | null): void;
  setDragging(isDragging: boolean): void;
}

export const ColumnDnDContext = createContext<IColumnDnDState | null>(null);
