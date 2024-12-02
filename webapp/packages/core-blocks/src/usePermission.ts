/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { SessionPermissionsResource } from '@cloudbeaver/core-root';

import { useResource } from './ResourcesHooks/useResource.js';

export function usePermission(key: string): boolean {
  const sessionPermissionsResource = useResource(usePermission, SessionPermissionsResource, undefined);

  return sessionPermissionsResource.data.has(key);
}
