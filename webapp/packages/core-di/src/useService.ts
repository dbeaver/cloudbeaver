/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useContext } from 'react';

import type { IServiceProvider } from './IServiceProvider.js';
import type { ServiceType } from './Service.js';
import { ServicesContext } from './ServicesContext.js';

export function useService<T>(key: ServiceType<T>): T {
  return useRuntime().getService(key);
}

export function useRuntime(): IServiceProvider {
  const provider = useContext(ServicesContext);

  if (!provider) {
    throw new Error('ServiceProvider is not available');
  }

  return provider;
}
