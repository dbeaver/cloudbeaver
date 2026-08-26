/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useResource } from '@cloudbeaver/core-blocks';
import { CachedMapAllKey } from '@cloudbeaver/core-resource';
import { UserInfoResource } from '@cloudbeaver/core-authentication';

import { ConnectionTypeResource } from './ConnectionTypeResource.js';
import { ConnectionInfoActiveProjectKey, ConnectionInfoResource } from '../ConnectionInfoResource.js';

/**
 * Preloads connection types once at a higher level — avoids per-node or per-connection useResource
 * subscriptions, which cause perfomance issues with 500+ entities. Used alongside useConnectionTypeColor.
 */
export function useConnectionTypeLoader(): void {
  const userInfoResource = useResource(useConnectionTypeLoader, UserInfoResource, undefined);

  useResource(useConnectionTypeLoader, ConnectionInfoResource, ConnectionInfoActiveProjectKey, { active: userInfoResource.resource.hasAccess() });
  useResource(useConnectionTypeLoader, ConnectionTypeResource, CachedMapAllKey);
}
