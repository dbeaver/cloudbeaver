/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createDataContext } from '@cloudbeaver/core-view';

export interface IResultSetGroupingData {
  getColumns(): string[];
  removeColumn(...columns: string[]): void;
  clear(): void;
}

export const DATA_CONTEXT_DV_DDM_RS_GROUPING = createDataContext<IResultSetGroupingData>('data-viewer-database-data-model-result-set-grouping-data');
