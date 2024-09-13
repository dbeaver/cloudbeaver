/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { isCloudConnection } from '@cloudbeaver/core-connections';
import type { DatabaseConnectionFragment, DatabaseConnectionOriginFragment } from '@cloudbeaver/core-sdk';

/**
 * @param  {DatabaseConnectionFragment[]} connections
 * @param  {string} filter
 */
export function getFilteredConnections(
  connections: DatabaseConnectionFragment[],
  connectionsOrigin: DatabaseConnectionOriginFragment[],
  filter: string,
): DatabaseConnectionFragment[] {
  const connectionsOriginsMap = new Map<string, DatabaseConnectionOriginFragment>();

  for (const connectionOrigin of connectionsOrigin) {
    connectionsOriginsMap.set(connectionOrigin.id, connectionOrigin);
  }

  return connections
    .filter(
      connection => connection.name.toLowerCase().includes(filter.toLowerCase()) && !isCloudConnection(connectionsOriginsMap.get(connection.id)),
    )
    .sort((a, b) => a.name.localeCompare(b.name));
}
