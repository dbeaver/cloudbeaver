/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IConnectionExecutionContextInfo } from '@cloudbeaver/core-connections';

export interface IResourceNodeInfo {
  nodeId: string;
  parents: string[];
}

export interface IResourceSqlDataSourceState {
  name?: string;
  nodeInfo?: IResourceNodeInfo;
  executionContext?: IConnectionExecutionContextInfo;
}