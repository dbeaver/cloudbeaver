/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { CachedMapResource, ConnectionConfig, GetConnectionsQueryVariables, TestConnectionMutation } from '@cloudbeaver/core-sdk';

import type { DatabaseConnection } from './DatabaseConnection';

export interface IConnectionsResource
  extends CachedMapResource<string, DatabaseConnection, GetConnectionsQueryVariables> {
  update: (config: ConnectionConfig) => Promise<DatabaseConnection>;
  create: (config: ConnectionConfig) => Promise<DatabaseConnection>;
  test: (config: ConnectionConfig) => Promise<TestConnectionMutation['connection']>;
}
