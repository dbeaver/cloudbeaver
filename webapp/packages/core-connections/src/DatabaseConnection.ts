/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { AUTH_PROVIDER_LOCAL_ID } from '@cloudbeaver/core-authentication';
import type { DatabaseConnectionFragment, DatabaseConnectionOriginFragment } from '@cloudbeaver/core-sdk';

export type DatabaseConnection = DatabaseConnectionFragment;
export type DatabaseConnectionOrigin = DatabaseConnectionOriginFragment;

export function isLocalConnection(connectionOrigin: DatabaseConnectionOrigin | DatabaseConnection): boolean {
  if (!('origin' in connectionOrigin) || !connectionOrigin.origin) {
    return true;
  }
  return connectionOrigin.origin.type === AUTH_PROVIDER_LOCAL_ID;
}

export function isCloudConnection(connectionOrigin?: DatabaseConnectionOrigin): boolean {
  if (!connectionOrigin?.origin) {
    return false;
  }
  return connectionOrigin.origin.type === 'cloud';
}
