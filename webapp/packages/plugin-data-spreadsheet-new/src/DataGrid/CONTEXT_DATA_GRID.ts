/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createDataContext } from '@cloudbeaver/core-data-context';
import type { IDataGridContext } from './DataGridContext.js';

export const CONTEXT_DATA_GRID = createDataContext<IDataGridContext>('data-grid-context');
