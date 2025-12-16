/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IGridColumnKey } from '@cloudbeaver/plugin-data-viewer';
import { createContext } from 'react';

export interface IDataGridPinContext {
  pinColumn: (columnKey: IGridColumnKey) => void;
  unpinColumn: (columnIndex: IGridColumnKey) => void;
  isColumnPinned: (columnIndex: IGridColumnKey) => boolean;
}

export const DataGridPinContext = createContext<IDataGridPinContext>(undefined as any);
