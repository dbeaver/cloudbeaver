/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createContext } from 'react';


import type { IExecutor } from '@cloudbeaver/core-executor';
import type { IDatabaseDataModel, IDataTableActions } from '@cloudbeaver/plugin-data-viewer';
import type { DataGridHandle } from '@cloudbeaver/plugin-react-data-grid';

export interface IColumnResizeInfo {
  column: number;
  width: number;
}

export interface IDataGridContext {
  model: IDatabaseDataModel;
  actions: IDataTableActions;
  resultIndex: number;
  columnResize: IExecutor<IColumnResizeInfo>;
  isGridInFocus: () => boolean;
  getEditorPortal: () => HTMLDivElement | null;
  getDataGridApi: () => DataGridHandle | null;
  focus: () => void;
}

export const DataGridContext = createContext<IDataGridContext>(undefined as any);
