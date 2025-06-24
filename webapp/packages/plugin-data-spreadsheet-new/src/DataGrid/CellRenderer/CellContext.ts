/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createContext } from 'react';

import type { DatabaseEditChangeType, IResultSetElementKey } from '@cloudbeaver/plugin-data-viewer';

import type { IColumnInfo } from '../TableDataContext.js';
import type { ICellPosition } from '@cloudbeaver/plugin-data-grid';

export interface ICellContext {
  isHovered: boolean;
  isFocused: boolean;
  isSelected: boolean;
  column: IColumnInfo;
  cell: IResultSetElementKey | undefined;
  position: ICellPosition;
  editionState: DatabaseEditChangeType | null;
  isMenuVisible: boolean;
  setMenuVisibility(visible: boolean): void;
}

export const CellContext = createContext<ICellContext>(undefined as any);
