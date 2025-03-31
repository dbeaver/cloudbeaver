/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useEffect, useRef } from 'react';
import { IServiceProvider, useService } from '@cloudbeaver/core-di';
import { ConnectionFormState } from './ConnectionFormState.js';
import { ConnectionFormService } from './ConnectionFormService.js';
import type { IConnectionFormState } from './IConnectionFormState.js';
import type { IConnectionInfoParams } from '@cloudbeaver/core-connections';

const EMPTY_CONNECTION_INFO_PARAMS: IConnectionFormState = {
  projectId: '',
  availableDrivers: [],
  type: 'admin',
  requiredNetworkHandlersIds: [],
  connectionId: undefined,
};

export function useConnectionFormState(params: IConnectionInfoParams, configure?: (state: ConnectionFormState) => any): ConnectionFormState {
  const serviceProvider = useService(IServiceProvider);
  const service = useService(ConnectionFormService);
  const ref = useRef<ConnectionFormState>(null);

  if (ref.current?.state.connectionId !== params.connectionId || ref.current?.state.projectId !== params.projectId) {
    ref.current?.dispose();
    ref.current = new ConnectionFormState(serviceProvider, service, {
      ...EMPTY_CONNECTION_INFO_PARAMS,
      projectId: params.projectId,
      connectionId: params.connectionId,
    });

    configure?.(ref.current);
  }

  useEffect(
    () => () => {
      ref.current?.dispose();
    },
    [],
  );

  return ref.current;
}
