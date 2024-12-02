/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createContext } from 'react';

import { IServiceProvider } from './IServiceProvider.js';

export const serviceProviderContext = createContext<IServiceProvider>(undefined as any);

export interface ServiceProviderContextProps extends React.PropsWithChildren {
  serviceProvider: IServiceProvider;
}

export const ServiceProviderContext: React.FC<ServiceProviderContextProps> = function ServiceProviderContext({ serviceProvider, children }) {
  return (
    //<StrictMode> // problems with TabState when empty -> displayed state switch
    <serviceProviderContext.Provider value={serviceProvider}>{children}</serviceProviderContext.Provider>
    //</StrictMode>
  );
};
