/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { ISyncExecutor } from '@cloudbeaver/core-executor';

import type { ISqlDataSourceHistoryState } from './ISqlDataSourceHistoryState.js';

export interface ISqlDataSourceHistory {
  readonly state: ISqlDataSourceHistoryState;
  readonly onNavigate: ISyncExecutor<string>;
  add(value: string, source?: string): void;
  undo(): void;
  redo(): void;
  restore(data: ISqlDataSourceHistoryState): void;
  clear(): void;
}
