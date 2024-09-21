/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { ISqlDataSourceHistoryState } from './ISqlDataSourceHistoryState.js';
import { validateSqlDataSourceHistoryData } from './validateSqlDataSourceHistoryData.js';

export function validateSqlDataSourceHistoryState(state: any): state is ISqlDataSourceHistoryState {
  return (
    typeof state === 'object' &&
    validateSqlDataSourceHistoryData(state.history) &&
    typeof state.historyIndex === 'number' &&
    state.historyIndex >= 0 &&
    state.historyIndex <= state.history.length
  );
}
