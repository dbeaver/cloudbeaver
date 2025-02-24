/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useRef } from 'react';
import { IServiceProvider, useService } from '@cloudbeaver/core-di';
import { ConnectionFormStateRefactored } from './ConnectionFormStateRefactored.js';
import { ConnectionFormServiceRefactored } from './ConnectionFormServiceRefactored.js';
import type { IConnectionInfoParams } from '@cloudbeaver/core-connections';

const EMPTY_CONNECTION_INFO_PARAMS: IConnectionInfoParams = { projectId: '', connectionId: '' };

// TODO is nullable return allowed?
export function useConnectionFormStateRefactored(
  connectionInfoParams: IConnectionInfoParams | null,
  configure?: (state: ConnectionFormStateRefactored) => any,
): ConnectionFormStateRefactored | null {
  const serviceProvider = useService(IServiceProvider);
  const service = useService(ConnectionFormServiceRefactored);
  const ref = useRef<null | ConnectionFormStateRefactored>(null);

  if (
    ref.current?.state.connectionInfoParams.connectionId !== connectionInfoParams?.connectionId ||
    ref.current?.state.connectionInfoParams.projectId !== connectionInfoParams?.projectId
  ) {
    ref.current = new ConnectionFormStateRefactored(serviceProvider, service, {
      connectionInfoParams: connectionInfoParams || EMPTY_CONNECTION_INFO_PARAMS,
    });
    configure?.(ref.current);
  }

  return ref.current;
}
