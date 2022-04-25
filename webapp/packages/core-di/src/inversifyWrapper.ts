/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { DIContainer } from './DIContainer';
import type { IServiceCollection, IServiceConstructor, IServiceInjector } from './IApp';
import type { ValueToken } from './InjectionToken';

export interface IDiWrapper {
  injector: IServiceInjector;
  collection: IServiceCollection;
  registerChildContainer: (container: DIContainer) => void;
}

const mainContainer = new DIContainer();

export const inversifyWrapper: IDiWrapper = {
  injector: {
    getServiceByClass<T>(ctor: IServiceConstructor<T>): T {
      return mainContainer.getServiceByClass(ctor);
    },
    getServiceByToken<T>(token: any): T {
      return mainContainer.getServiceByToken(token);
    },
    resolveServiceByClass<T>(ctor: IServiceConstructor<T>): T {
      return mainContainer.resolveServiceByClass(ctor);
    },
  },

  collection: {
    addServiceByClass(Ctor: IServiceConstructor<any>, value?: any): void {
      mainContainer.addServiceByClass(Ctor, value);
    },

    addServiceByToken<T extends Record<string, unknown>>(
      token: ValueToken<T> | IServiceConstructor<T>,
      value: T
    ): void {
      mainContainer.addServiceByToken(token, value);
    },
  },

  registerChildContainer(container: DIContainer): void {
    container.bindWithParent(mainContainer);
  },

};
