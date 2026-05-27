/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import React, { createContext } from 'react';

import type { IContextMenuPosition } from '@cloudbeaver/core-blocks';
import type { IGridDataKey } from '@cloudbeaver/plugin-data-viewer';
import type { ICellContext } from './CellContext.js';

export interface ITableMenuContext {
  activeCell: IGridDataKey | undefined | null;
  menuPosition: IContextMenuPosition;
  isMenuOpened: boolean;
  openMenu(cellContext: ICellContext, event: React.MouseEvent): void;
  closeMenu(): void;
}

export const TableMenuContext = createContext<ITableMenuContext>(undefined as any);
