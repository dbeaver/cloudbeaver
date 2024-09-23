/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createContext } from 'react';

import type { IMouseHook } from '@cloudbeaver/core-blocks';
import type { DatabaseEditChangeType, IResultSetElementKey } from '@cloudbeaver/plugin-data-viewer';

import type { CellPosition } from '../../Editing/EditingContext.js';

export interface ICellContext {
  mouse: IMouseHook<HTMLDivElement>;
  cell: IResultSetElementKey | undefined;
  position: CellPosition;
  isEditing: boolean;
  isSelected: boolean;
  isFocused: boolean;
  editionState: DatabaseEditChangeType | null;
}

export const CellContext = createContext<ICellContext>(undefined as any);
