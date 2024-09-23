/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IServiceConstructor, IServiceInjector } from './IApp.js';

export class IServiceProvider {
  constructor(private injector: IServiceInjector) {}

  getService<T>(service: IServiceConstructor<T>): T {
    return this.injector.getServiceByClass(service);
  }
}
