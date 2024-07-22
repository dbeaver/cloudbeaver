/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IExecutorHandlersCollection, ISyncContextLoader } from '@cloudbeaver/core-executor';

import { dependencyInjectorContext } from './dependencyInjectorContext';
import type { IServiceConstructor } from './IApp';
import { injectable } from './injectable';
import { IServiceProvider } from './IServiceProvider';

@injectable()
export class DIService {
  constructor(private readonly serviceProvider: IServiceProvider) {}

  addDIContext(context: IExecutorHandlersCollection<any>): void {
    context.addContextCreator(dependencyInjectorContext, this.dependencyInjectorContext);
  }

  private readonly dependencyInjectorContext: ISyncContextLoader<<T>(ctor: IServiceConstructor<T>) => T> = () =>
    this.serviceProvider.getService.bind(this.serviceProvider);
}
