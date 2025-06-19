/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { ISyncExecutor } from '@cloudbeaver/core-executor';

import type { ISqlDataSourceHistoryState } from './ISqlDataSourceHistoryState.js';
import type { ISqlEditorCursor } from '../ISqlDataSource.js';

export interface ISqlDataSourceHistory {
  readonly state: ISqlDataSourceHistoryState;
  readonly onNavigate: ISyncExecutor<{
    value: string;
    cursor?: ISqlEditorCursor;
  }>;
  add(value: string, source?: string, cursor?: ISqlEditorCursor): void;
  undo(): void;
  redo(): void;
  restore(data: ISqlDataSourceHistoryState): void;
  clear(): void;
}
