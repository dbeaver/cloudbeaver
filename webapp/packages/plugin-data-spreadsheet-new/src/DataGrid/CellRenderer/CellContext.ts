/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { DatabaseEditChangeType, IGridDataKey } from '@cloudbeaver/plugin-data-viewer';

import type { IColumnInfo } from '../TableDataContext.js';
import type { ICellPosition } from '@cloudbeaver/plugin-data-grid';
import { createContext } from 'react';

export interface ICellContext {
  isHovered: boolean;
  isFocused: boolean;
  isSelected: boolean;
  isMenuVisible: boolean;
  column: IColumnInfo;
  cell: IGridDataKey | undefined;
  position: ICellPosition;
  editionState: DatabaseEditChangeType | null;
  openMenu(event: React.MouseEvent): void;
  closeMenu(): void;
}

export const CellContext = createContext<ICellContext>(undefined as any);
