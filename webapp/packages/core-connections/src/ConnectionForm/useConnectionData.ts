/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useRef } from 'react';

import type { IConnectionFormData } from './ConnectionFormService';

interface IState {
  connectionId: string | undefined;
  driverId: string | undefined;
}

export function useConnectionData(data: IConnectionFormData, fill: (data: IConnectionFormData) => void): void {
  const connectionId = data.info?.id || data.config.connectionId;
  const driverId = data.info?.driverId || data.config.driverId;

  const firstRenderRef = useRef<IState>({
    connectionId: undefined,
    driverId: undefined,
  });

  if (
    firstRenderRef.current.connectionId !== connectionId
    || firstRenderRef.current.driverId !== driverId
  ) {
    fill(data);
    firstRenderRef.current.connectionId = connectionId;
    firstRenderRef.current.driverId = driverId;
  }
}
