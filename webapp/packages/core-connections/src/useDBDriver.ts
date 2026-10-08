/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useCallback } from 'react';

import { useService } from '@cloudbeaver/core-di';

import { DBDriverResource } from './DBDriverResource.js';

export function useDBDriver(driverId: string) {
  const dbDriverResource = useService(DBDriverResource);

  const driver = dbDriverResource.get(driverId);
  const load = useCallback(() => dbDriverResource.load(driverId), [dbDriverResource, driverId]);
  const refresh = useCallback(() => dbDriverResource.refresh(driverId), [dbDriverResource, driverId]);
  const isLoading = useCallback(() => dbDriverResource.isLoading(driverId), [dbDriverResource, driverId]);
  const isLoaded = useCallback(() => dbDriverResource.isLoaded(driverId), [dbDriverResource, driverId]);

  return {
    driver,
    isLoading,
    isLoaded,
    load,
    refresh,
  };
}
