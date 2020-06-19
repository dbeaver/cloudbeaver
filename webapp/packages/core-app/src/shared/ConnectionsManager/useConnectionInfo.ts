/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useCallback } from 'react';

import { useService } from '@cloudbeaver/core-di';

import { ConnectionsManagerService } from './ConnectionsManagerService';

export function useConnectionInfo(connectionId: string) {
  const service = useService(ConnectionsManagerService);

  const connectionInfo = service.getConnectionById(connectionId);
  const load = useCallback(() => service.loadConnectionInfoAsync(connectionId), [service, connectionId]);
  const refresh = useCallback(() => service.refreshConnectionInfoAsync(connectionId), [service, connectionId]);
  const isLoading = useCallback(() => service.connectionInfo.isDataLoading({ connectionId }), [service, connectionId]);
  const isLoaded = useCallback(() => service.connectionInfo.isLoaded({ connectionId }), [service, connectionId]);

  return {
    connectionInfo,
    isLoading,
    isLoaded,
    load,
    refresh,
  };
}
