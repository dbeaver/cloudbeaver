/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IExecutorHandlersCollection, ISyncContextLoader } from '@cloudbeaver/core-executor';

import { App } from './App';
import { dependencyInjectorContext } from './dependencyInjectorContext';
import type { IServiceConstructor, IServiceInjector } from './IApp';
import { injectable } from './injectable';

@injectable()
export class DIService {
  get serviceInjector(): IServiceInjector {
    return this.app.getServiceInjector();
  }

  constructor(private readonly app: App) {}

  addDIContext(context: IExecutorHandlersCollection<any>): void {
    context.addContextCreator(dependencyInjectorContext, this.dependencyInjectorContext);
  }

  private readonly dependencyInjectorContext: ISyncContextLoader<<T>(ctor: IServiceConstructor<T>) => T> = () =>
    this.serviceInjector.getServiceByClass.bind(this);
}
