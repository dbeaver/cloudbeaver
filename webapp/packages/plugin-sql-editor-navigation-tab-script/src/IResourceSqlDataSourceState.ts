/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IConnectionExecutionContextInfo } from '@cloudbeaver/core-connections';
import type { ISqlDataSourceHistoryState } from '@cloudbeaver/plugin-sql-editor';

export interface IResourceSqlDataSourceState {
  resourceKey?: string;
  script: string;
  baseScript: string;
  executionContext?: IConnectionExecutionContextInfo;
  baseExecutionContext?: IConnectionExecutionContextInfo;
  history: ISqlDataSourceHistoryState;
}
