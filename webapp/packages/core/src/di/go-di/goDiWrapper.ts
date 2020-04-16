/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import {
  IScopeService,
  Scope,
} from 'go-di';

import { IServiceConstructor } from '../IApp';
import { IDiWrapper } from '../inversifyWrapper';

const scope = new Scope();

export const goDiWrapper: IDiWrapper = {
  injector: {
    getServiceByClass<T>(ctor: IServiceConstructor<T>): T {
      // todo correct implementation required
      return scope.get<T>(ctor as unknown as IScopeService<T>);
    },

    getServiceByToken<T>(token: any): T {
      // todo correct implementation required
      return scope.get<T>(token as unknown as IScopeService<T>);
    },

    resolveServiceByClass<T>(ctor: IServiceConstructor<T>): T {
      // todo implementation required
      return {} as T;
    },
  },

  collection: {
    addServiceByClass<T>(ctor: IServiceConstructor<T>): void {
      // todo correct implementation required
      scope.attachFactory(ctor as unknown as IScopeService<T>, ctor as any, true);
    },

    addServiceByToken<T>(token: any, value: T): void {
      // todo correct implementation required
      scope.attach(token, value);
    },
  },
};
