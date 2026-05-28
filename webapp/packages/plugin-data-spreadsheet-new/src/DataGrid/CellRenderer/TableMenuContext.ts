/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createContext } from 'react';

import type { IContextMenuPosition } from '@cloudbeaver/core-blocks';
import type { IGridDataKey } from '@cloudbeaver/plugin-data-viewer';

export interface ITableMenuContext {
  menuPosition: IContextMenuPosition;
  isMenuOpened: boolean;
  openMenu(activeCell: IGridDataKey, event: React.MouseEvent): void;
  openMenuAt(activeCell: IGridDataKey, x: number, y: number): void;
  closeMenu(): void;
}

export const TableMenuContext = createContext<ITableMenuContext>(undefined as any);
