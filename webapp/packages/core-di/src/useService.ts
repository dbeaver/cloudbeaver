/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useContext, useMemo } from 'react';

import { appContext } from './AppContext';
import { IServiceConstructor } from './IApp';
import { ValueToken } from './InjectionToken';

export function useService<T>(ctor: IServiceConstructor<T>): T {
  const app = useContext(appContext);
  return useMemo(() => app.getServiceByClass(ctor), [app, ctor]);
}

export function useServiceByToken<T>(token: ValueToken<T>): T {
  const app = useContext(appContext);
  return useMemo(() => app.getServiceByToken(token), [app, token]);
}
