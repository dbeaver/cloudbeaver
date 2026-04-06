/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IGridDataKey } from '@cloudbeaver/plugin-data-viewer';

import type { ITableData } from '../../TableDataContext.js';

export interface ICellContext {
  tableData: ITableData;
  key: IGridDataKey;
}

export interface ICellValueContext {
  tableData: ITableData;
  key: IGridDataKey;
  value: unknown;
}
