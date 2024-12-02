/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { AUTH_PROVIDER_LOCAL_ID } from '@cloudbeaver/core-authentication';
import type { DatabaseConnectionFragment, ObjectOriginInfoFragment } from '@cloudbeaver/core-sdk';

export type DatabaseConnection = DatabaseConnectionFragment;

export function isLocalConnection(origin: ObjectOriginInfoFragment): boolean {
  return origin.type === AUTH_PROVIDER_LOCAL_ID;
}

export function isCloudConnection(origin: ObjectOriginInfoFragment): boolean {
  return origin.type === 'cloud';
}
