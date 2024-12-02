/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { DIContainer } from './DIContainer.js';
import type { IServiceCollection, IServiceConstructor, IServiceInjector } from './IApp.js';

export interface IDiWrapper {
  injector: IServiceInjector;
  collection: IServiceCollection;
  registerChildContainer: (container: DIContainer) => void;
}

const mainContainer = new DIContainer();

export const inversifyWrapper: IDiWrapper = {
  injector: {
    hasServiceByClass<T>(ctor: IServiceConstructor<T>): boolean {
      return mainContainer.hasServiceByClass(ctor);
    },
    getServiceByClass<T>(ctor: IServiceConstructor<T>): T {
      return mainContainer.getServiceByClass(ctor);
    },
    resolveServiceByClass<T>(ctor: IServiceConstructor<T>): T {
      return mainContainer.resolveServiceByClass(ctor);
    },
  },

  collection: {
    addServiceByClass(Ctor: IServiceConstructor<any>, value?: any): void {
      mainContainer.addServiceByClass(Ctor, value);
    },
    unbindAll() {
      mainContainer.unbindAll();
    },
  },

  registerChildContainer(container: DIContainer): void {
    container.bindWithParent(mainContainer);
  },
};
