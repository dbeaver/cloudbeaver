/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { AUTH_PROVIDER_LOCAL_ID } from '@cloudbeaver/core-authentication';
import type { DatabaseConnectionFragment } from '@cloudbeaver/core-sdk';

export type DatabaseConnection = DatabaseConnectionFragment;

export function isLocalConnection(connection: DatabaseConnection): boolean {
  if (!connection.origin) {
    return true;
  }
  return connection.origin.type === AUTH_PROVIDER_LOCAL_ID;
}

export function isCloudConnection(connection: DatabaseConnection): boolean {
  if (!connection.origin) {
    return false;
  }
  return connection.origin.type === 'cloud';
}
