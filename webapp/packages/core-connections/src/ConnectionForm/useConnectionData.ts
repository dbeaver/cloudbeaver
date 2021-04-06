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
import type { IConnectionFormData } from './ConnectionFormService';

interface IState {
  config: ConnectionConfig | undefined;
  connectionId: string | undefined;
  driverId: string | undefined;
  info: DatabaseConnection | undefined;
}

export function useConnectionData(
  data: IConnectionFormData,
  fill: (data: IConnectionFormData, update: boolean) => void
): void {
  const connectionId = data.info?.id || data.config.connectionId;
  const driverId = data.info?.driverId || data.config.driverId;

  const lastDataRef = useObjectRef<IState>({
    connectionId: undefined,
    driverId: undefined,
    config: undefined,
    info: undefined,
  }, {});

  if (
    lastDataRef.connectionId !== connectionId
    || lastDataRef.driverId !== driverId
    || lastDataRef.config !== data.config
    || lastDataRef.info !== data.info
  ) {
    fill(
      data,
      lastDataRef.connectionId !== null
      || lastDataRef.driverId !== null
      || lastDataRef.config !== data.config
      || lastDataRef.info !== data.info
    );
    lastDataRef.connectionId = connectionId;
    lastDataRef.driverId = driverId;
    lastDataRef.config = data.config;
    lastDataRef.info = data.info;
  }
}
