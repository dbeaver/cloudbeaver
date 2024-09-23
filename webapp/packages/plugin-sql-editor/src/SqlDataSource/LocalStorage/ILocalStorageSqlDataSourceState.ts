/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IConnectionExecutionContextInfo } from '@cloudbeaver/core-connections';

import type { ISqlDataSourceHistoryState } from '../SqlDataSourceHistory/ISqlDataSourceHistoryState.js';

export interface ILocalStorageSqlDataSourceState {
  script: string;
  name?: string;
  executionContext?: IConnectionExecutionContextInfo;
  history: ISqlDataSourceHistoryState;
}
