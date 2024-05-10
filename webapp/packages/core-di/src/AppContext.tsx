/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createContext } from 'react';

import type { IServiceInjector } from './IApp';

export const appContext = createContext<IServiceInjector>(undefined as any);

export interface AppContextProps extends React.PropsWithChildren {
  app: IServiceInjector;
}

export const AppContext: React.FC<AppContextProps> = function AppContext({ app, children }) {
  return (
    //<StrictMode> // problems with TabState when empty -> displayed state switch
    <appContext.Provider value={app}>{children}</appContext.Provider>
    //</StrictMode>
  );
};
