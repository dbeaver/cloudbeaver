/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useContext } from 'react';

import { appContext } from './AppContext';
import type { IServiceConstructor } from './IApp';
import type { ValueToken } from './InjectionToken';

export function useService<T>(ctor: IServiceConstructor<T>): T;
export function useService<T>(ctor: IServiceConstructor<T>, optional: true): T | undefined;
export function useService<T>(ctor: IServiceConstructor<T>, optional?: boolean): T | undefined {
  const app = useContext(appContext);

  if (optional && !app.hasServiceByClass(ctor)) {
    return undefined;
  }

  return app.getServiceByClass(ctor);
}

export function useServiceByToken<T>(token: ValueToken<T>): T {
  const app = useContext(appContext);
  return app.getServiceByToken(token);
}
