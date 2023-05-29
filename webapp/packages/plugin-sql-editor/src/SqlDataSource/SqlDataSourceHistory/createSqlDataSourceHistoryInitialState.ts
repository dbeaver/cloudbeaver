/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { ISqlDataSourceHistoryState } from './ISqlDataSourceHistoryState';

export function createSqlDataSourceHistoryInitialState(value = ''): ISqlDataSourceHistoryState {
  return {
    history: [{ value, source: 'initial' }],
    historyIndex: 0,
  };
}
