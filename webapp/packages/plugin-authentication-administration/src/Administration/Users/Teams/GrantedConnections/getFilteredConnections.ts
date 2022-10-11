/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { isCloudConnection } from '@cloudbeaver/core-connections';
import type { DatabaseConnectionFragment } from '@cloudbeaver/core-sdk';

/**
 * @param  {DatabaseConnectionFragment[]} connections
 * @param  {string} filter
 */
export function getFilteredConnections(
  connections: DatabaseConnectionFragment[],
  filter: string
): DatabaseConnectionFragment[] {
  return connections
    .filter(
      connection => connection.name.toLowerCase().includes(filter.toLowerCase()) && !isCloudConnection(connection)
    )
    .sort((a, b) => (a.name).localeCompare(b.name));
}
