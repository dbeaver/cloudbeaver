/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useObjectRef } from '@cloudbeaver/core-blocks';
import type { ConnectionConfig } from '@cloudbeaver/core-sdk';

import type { DatabaseConnection } from '../Administration/ConnectionsResource';
import type { IConnectionFormState } from './ConnectionFormService';

interface IState {
  config: ConnectionConfig | undefined;
  connectionId: string | undefined;
  driverId: string | undefined;
  info: DatabaseConnection | undefined;
}

export function useConnectionData(
  state: IConnectionFormState,
  fill: (state: IConnectionFormState, update: boolean) => void
): void {
  const lastDataRef = useObjectRef<IState>({
    connectionId: undefined,
    driverId: undefined,
    config: undefined,
    info: undefined,
  }, {});

  if (
    lastDataRef.connectionId !== state.config.connectionId
    || lastDataRef.driverId !== state.config.driverId
    || lastDataRef.config !== state.config
    || lastDataRef.info !== state.info
  ) {
    fill(
      state,
      lastDataRef.connectionId !== null
      || lastDataRef.driverId !== null
      || lastDataRef.config !== state.config
      || lastDataRef.info !== state.info
    );
    lastDataRef.connectionId = state.config.connectionId;
    lastDataRef.driverId = state.config.driverId;
    lastDataRef.config = state.config;
    lastDataRef.info = state.info;
  }
}
