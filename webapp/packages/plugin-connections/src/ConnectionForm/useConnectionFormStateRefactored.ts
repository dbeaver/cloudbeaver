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
import type { IConnectionFormStateRefactored } from './IConnectionFormStateRefactored.js';
import type { IConnectionInfoParams } from '@cloudbeaver/core-connections';

const EMPTY_CONNECTION_INFO_PARAMS: IConnectionFormStateRefactored = {
  projectId: '',
  config: {},
  submitType: 'submit',
  availableDrivers: [],
  type: 'admin',
};

export function useConnectionFormStateRefactored(
  params: IConnectionInfoParams,
  configure?: (state: ConnectionFormStateRefactored) => any,
): ConnectionFormStateRefactored {
  const serviceProvider = useService(IServiceProvider);
  const service = useService(ConnectionFormServiceRefactored);
  const ref = useRef<ConnectionFormStateRefactored>(null);

  if (ref.current?.state.config.connectionId !== params.connectionId || ref.current?.state.projectId !== params.projectId) {
    ref.current = new ConnectionFormStateRefactored(serviceProvider, service, {
      ...EMPTY_CONNECTION_INFO_PARAMS,
      projectId: params.projectId,
      config: {
        ...EMPTY_CONNECTION_INFO_PARAMS.config,
        connectionId: params.connectionId,
      },
    });
    configure?.(ref.current);
  }

  return ref.current;
}
