/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { ISyncContextLoader } from '@cloudbeaver/core-executor';

import type { App } from './App';
import type { IServiceConstructor, IServiceInjector } from './IApp';
import { injectable } from './injectable';

@injectable()
export class DIService {
  get serviceInjector(): IServiceInjector {
    return this.app.getServiceInjector();
  }

  constructor(
    private readonly app: App
  ) { }

  dependencyInjectorContext: ISyncContextLoader<<T>(ctor: IServiceConstructor<T>) => T> = (
    () => this.serviceInjector.getServiceByClass.bind(this)
  );
}