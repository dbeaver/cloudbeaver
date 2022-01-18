/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useCallback } from 'react';

import { useService } from '@cloudbeaver/core-di';

import { DBDriverResource } from './DBDriverResource';

export function useDBDriver(driverId: string) {
  const service = useService(DBDriverResource);

  const driver = service.get(driverId);
  const load = useCallback(() => service.load(driverId), [service, driverId]);
  const refresh = useCallback(() => service.refresh(driverId), [service, driverId]);
  const isLoading = useCallback(() => service.isDataLoading(driverId), [service, driverId]);
  const isLoaded = useCallback(() => service.isLoaded(driverId), [service, driverId]);

  return {
    driver,
    isLoading,
    isLoaded,
    load,
    refresh,
  };
}
