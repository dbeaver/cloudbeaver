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

const EMPTY_CONNECTION_INFO_PARAMS: IConnectionFormStateRefactored = { projectId: '', connectionId: '', driverId: '', submitType: 'submit' };

// TODO is nullable return allowed?
export function useConnectionFormStateRefactored(
  state: IConnectionFormStateRefactored | null,
  configure?: (state: ConnectionFormStateRefactored) => any,
): ConnectionFormStateRefactored | null {
  const serviceProvider = useService(IServiceProvider);
  const service = useService(ConnectionFormServiceRefactored);
  const ref = useRef<null | ConnectionFormStateRefactored>(null);

  if (
    ref.current?.state.connectionId !== state?.connectionId ||
    ref.current?.state.projectId !== state?.projectId ||
    ref.current?.state.driverId !== state?.driverId
  ) {
    ref.current = new ConnectionFormStateRefactored(serviceProvider, service, state || EMPTY_CONNECTION_INFO_PARAMS);
    configure?.(ref.current);
  }

  return ref.current;
}
