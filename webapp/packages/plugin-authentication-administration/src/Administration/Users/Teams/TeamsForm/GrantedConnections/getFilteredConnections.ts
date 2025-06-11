/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { type ConnectionInfoCustomOptions, type ConnectionInfoOrigin, isCloudConnection } from '@cloudbeaver/core-connections';

/**
 * @param  {DatabaseConnectionFragment[]} connections
 * @param  {string} filter
 */
export function getFilteredConnections(
  connections: ConnectionInfoCustomOptions[],
  connectionsOrigin: ConnectionInfoOrigin[],
  filter: string,
): ConnectionInfoCustomOptions[] {
  const connectionsOriginsMap = new Map<string, ConnectionInfoOrigin>();

  for (const connectionOrigin of connectionsOrigin) {
    connectionsOriginsMap.set(connectionOrigin.id, connectionOrigin);
  }

  return connections
    .filter(connection => {
      const originDetails = connectionsOriginsMap.get(connection.id);

      return connection.name.toLowerCase().includes(filter.toLowerCase()) && originDetails && !isCloudConnection(originDetails.origin);
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}
