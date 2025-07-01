/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { ISqlEditorCursor } from '../ISqlDataSource.js';

export interface ISqlDataSourceHistoryData {
  value: string;
  cursor?: ISqlEditorCursor;
  timestamp: number;
  source?: string;
}
