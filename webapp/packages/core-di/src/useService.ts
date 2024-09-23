/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useContext } from 'react';

import type { IServiceConstructor } from './IApp.js';
import { serviceProviderContext } from './ServiceProviderContext.js';

export function useService<T>(ctor: IServiceConstructor<T>): T;
export function useService<T>(ctor: IServiceConstructor<T>, optional: true): T | undefined;
export function useService<T>(ctor: IServiceConstructor<T>, optional?: boolean): T | undefined {
  const serviceProvider = useContext(serviceProviderContext);

  if (optional) {
    try {
      return serviceProvider.getService(ctor);
    } catch {
      return undefined;
    }
  }

  return serviceProvider.getService(ctor);
}
