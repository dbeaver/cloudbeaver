/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { Executor, type IExecutor } from '@cloudbeaver/core-executor';
import { RouterService } from '@cloudbeaver/core-routing';

export class NavigationServiceImpl {
  readonly navigationTask: IExecutor<any>;

  constructor(routerService: RouterService) {
    this.navigationTask = new Executor();
    routerService.transitionTask.before(this.navigationTask);
  }
}

export type NavigationService = NavigationServiceImpl;

export class NavigationServiceDI extends Context.Service<NavigationServiceDI, NavigationServiceImpl>()(
  '@cloudbeaver/core-ui/Screens/AppScreen/NavigationService#NavigationService',
) {
  static readonly implementation = NavigationServiceImpl;

  static readonly dependencies = () => [RouterService] as const;
  static readonly make: Effect.Effect<NavigationServiceImpl, never, Context.Service.Identifier<typeof RouterService>> = Effect.gen(
    function* makeNavigationService() {
      const routerService = yield* RouterService;

      return new NavigationServiceImpl(routerService);
    },
  );
  static readonly layer: Layer.Layer<NavigationServiceDI, never, Context.Service.Identifier<typeof RouterService>> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const NavigationService = NavigationServiceDI;
