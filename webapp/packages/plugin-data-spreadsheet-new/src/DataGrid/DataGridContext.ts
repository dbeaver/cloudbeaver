/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createContext } from 'react';

import type { DataGridRef } from '@cloudbeaver/plugin-data-grid';
import type { IDatabaseDataModel, IDataTableActions } from '@cloudbeaver/plugin-data-viewer';

export interface IColumnResizeInfo {
  column: number;
  width: number;
}

export interface IDataGridContext {
  model: IDatabaseDataModel;
  actions: IDataTableActions;
  resultIndex: number;
  simple: boolean;
  isGridInFocus: () => boolean;
  getDataGridApi: () => DataGridRef | null;
  focus: () => void;
}

export const DataGridContext = createContext<IDataGridContext>(undefined as any);
