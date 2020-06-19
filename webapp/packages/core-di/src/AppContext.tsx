/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createContext, PropsWithChildren } from 'react';

import { IServiceInjector } from './IApp';

export const appContext = createContext<IServiceInjector>(undefined as any);

type AppContextProps = PropsWithChildren<{ app: IServiceInjector }>

export function AppContext({ app, children }: AppContextProps) {
  return <appContext.Provider value={app}>{children}</appContext.Provider>;
}
