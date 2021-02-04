/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createContext } from 'react';

import type { IDatabaseDataModel } from '@cloudbeaver/plugin-data-viewer';

export interface IDataGridContext {
  model: IDatabaseDataModel<any>;
  resultIndex: number;
  getEditorPortal: () => HTMLDivElement | null;
}

export const DataGridContext = createContext<IDataGridContext | null>(null);
