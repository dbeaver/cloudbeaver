/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createDataContext } from '@cloudbeaver/core-view';

import type { IResultSetColumnKey } from '../IResultSetDataKey';

export const DATA_CONTEXT_DV_DDM_RS_COLUMN_KEY = createDataContext<IResultSetColumnKey | null>(
  'data-viewer-database-data-model-result-set-column-key',
);
