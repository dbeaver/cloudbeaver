/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useCallback } from 'react';

import { useService } from '@cloudbeaver/core-di';

import { ConnectionInfoResource } from './ConnectionInfoResource';
import { ConnectionsManagerService } from './ConnectionsManagerService';

export function useConnectionInfo(connectionId: string) {
  const manager = useService(ConnectionsManagerService);
  const resource = useService(ConnectionInfoResource);

  const connectionInfo = resource.get(connectionId);
  const load = useCallback(() => resource.load(connectionId), [resource, connectionId]);
  const refresh = useCallback(() => resource.refresh(connectionId), [resource, connectionId]);
  const isLoading = useCallback(() => resource.isDataLoading(connectionId), [resource, connectionId]);
  const isLoaded = useCallback(() => resource.isLoaded(connectionId), [resource, connectionId]);
  const isOutdated = useCallback(() => resource.isOutdated(connectionId), [resource, connectionId]);
  const connect = useCallback(() => manager.requireConnection(connectionId), [manager, connectionId]);

  return {
    connectionInfo,
    resource,
    isLoading,
    isLoaded,
    isOutdated,
    load,
    refresh,
    connect,
  };
}
