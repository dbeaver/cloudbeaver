/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useRef } from 'react';

import type { ConnectionConfig } from '@cloudbeaver/core-sdk';

import type { IConnectionFormData } from './ConnectionFormService';

interface IState {
  config: ConnectionConfig | undefined;
  connectionId: string | undefined;
  driverId: string | undefined;
}

export function useConnectionData(
  data: IConnectionFormData,
  fill: (data: IConnectionFormData, update: boolean) => void
): void {
  const connectionId = data.info?.id || data.config.connectionId;
  const driverId = data.info?.driverId || data.config.driverId;

  const lastDataRef = useRef<IState>({
    connectionId: undefined,
    driverId: undefined,
    config: undefined,
  });

  if (
    lastDataRef.current.connectionId !== connectionId
    || lastDataRef.current.driverId !== driverId
    || lastDataRef.current.config !== data.config
  ) {
    fill(
      data,
      lastDataRef.current.connectionId !== null
      || lastDataRef.current.driverId !== null
      || lastDataRef.current.config !== data.config
    );
    lastDataRef.current.connectionId = connectionId;
    lastDataRef.current.driverId = driverId;
    lastDataRef.current.config = data.config;
  }
}
