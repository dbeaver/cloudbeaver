/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IExecutorHandlersCollection, ISyncContextLoader } from '@cloudbeaver/core-executor';

import { dependencyInjectorContext } from './dependencyInjectorContext.js';
import type { ServiceType } from './Service.js';

import { IServiceProvider } from './IServiceProvider.js';
import { Context, Effect, Layer, disposeService } from './Service.js';

export class DIServiceImpl {
  constructor(private readonly serviceProvider: IServiceProvider) {}

  addDIContext(context: IExecutorHandlersCollection<any>): void {
    context.addContextCreator(dependencyInjectorContext, this.dependencyInjectorContext);
  }

  private readonly dependencyInjectorContext: ISyncContextLoader<<T>(ctor: ServiceType<T>) => T> = () =>
    this.serviceProvider.getService.bind(this.serviceProvider);
}

export type DIService = DIServiceImpl;

export class DIServiceDI extends Context.Service<DIServiceDI, DIServiceImpl>()('@cloudbeaver/core-di/DIService#DIService') {
  static readonly implementation = DIServiceImpl;

  static readonly dependencies = () => [IServiceProvider] as const;
  static readonly make: Effect.Effect<DIServiceImpl, never, Context.Service.Identifier<typeof IServiceProvider>> = Effect.gen(
    function* makeDIService() {
      const serviceProvider = yield* IServiceProvider;

      return new DIServiceImpl(serviceProvider);
    },
  );
  static readonly layer: Layer.Layer<DIServiceDI, never, Context.Service.Identifier<typeof IServiceProvider>> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const DIService = DIServiceDI;
