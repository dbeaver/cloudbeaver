/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { SqlResultSet } from '@cloudbeaver/core-sdk';

import type { IDatabaseDataResult } from './IDatabaseDataResult.js';

export interface IDatabaseResultSet extends IDatabaseDataResult {
  totalCount: number | null;
  updateRowCount: number;
  projectId: string;
  connectionId: string;
  contextId: string;
  data: SqlResultSet | undefined;
}
