/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createContext } from 'react';

import type { IResultSetElementKey } from '@cloudbeaver/plugin-data-viewer';

import type { IDraggingPosition } from '../useGridDragging';

export interface IDataGridSelectionContext {
  selectedCells: Map<string, IResultSetElementKey[]>;
  select: (cell: IDraggingPosition, multiple: boolean, range: boolean, temporary: boolean) => void;
  selectColumn: (colIdx: number, multiple: boolean) => void;
  selectTable: () => void;
  isSelected: (rowIdx: number, colIdx: number) => boolean;
  selectRange: (
    startPosition: IDraggingPosition,
    lastPosition: IDraggingPosition,
    multiple: boolean,
    temporary: boolean
  ) => void;
}

export const DataGridSelectionContext = createContext<IDataGridSelectionContext>(undefined as any);
