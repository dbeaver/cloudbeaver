/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
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
  const service = useService(ConnectionInfoResource);

  const connectionInfo = service.get(connectionId);
  const load = useCallback(() => service.load(connectionId), [service, connectionId]);
  const refresh = useCallback(() => service.refresh(connectionId), [service, connectionId]);
  const isLoading = useCallback(() => service.isDataLoading(connectionId), [service, connectionId]);
  const isLoaded = useCallback(() => service.isLoaded(connectionId), [service, connectionId]);
  const connect = useCallback(() => manager.requireConnection(connectionId), [manager, connectionId]);

  return {
    connectionInfo,
    isLoading,
    isLoaded,
    load,
    refresh,
    connect,
  };
}
