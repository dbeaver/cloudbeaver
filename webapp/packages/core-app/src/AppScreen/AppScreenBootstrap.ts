/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { Executor, type IExecutor } from '@cloudbeaver/core-executor';
import { ScreenService } from '@cloudbeaver/core-routing';

import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { AppScreenServiceImpl } from './AppScreenService.js';
import { SkipNavService } from './SkipNavService.js';

const AppScreen = importLazyComponent(() => import('./AppScreen.js').then(m => m.AppScreen));

export class AppScreenBootstrapImpl extends Bootstrap {
  readonly activation: IExecutor;

  constructor(
    private readonly screenService: ScreenService,
    private readonly skipNavService: SkipNavService,
  ) {
    super();
    this.activation = new Executor();
  }

  override register(): void {
    this.screenService.create({
      name: AppScreenServiceImpl.screenName,
      routes: [{ name: AppScreenServiceImpl.screenName, path: '/' }],
      component: AppScreen,
      root: true,
      onActivate: async () => {
        await this.activation.execute();
      },
    });

    this.skipNavService.registerLinks();
  }
}

export type AppScreenBootstrap = AppScreenBootstrapImpl;

export class AppScreenBootstrapDI extends Context.Service<AppScreenBootstrapDI, AppScreenBootstrapImpl>()(
  '@cloudbeaver/core-app/AppScreen/AppScreenBootstrap#AppScreenBootstrap',
) {
  static readonly implementation = AppScreenBootstrapImpl;

  static readonly dependencies = () => [ScreenService, SkipNavService] as const;
  static readonly make: Effect.Effect<
    AppScreenBootstrapImpl,
    never,
    Context.Service.Identifier<typeof ScreenService> | Context.Service.Identifier<typeof SkipNavService>
  > = Effect.gen(function* makeAppScreenBootstrap() {
    const screenService = yield* ScreenService;
    const skipNavService = yield* SkipNavService;

    return new AppScreenBootstrapImpl(screenService, skipNavService);
  });
  static readonly layer: Layer.Layer<
    AppScreenBootstrapDI,
    never,
    Context.Service.Identifier<typeof ScreenService> | Context.Service.Identifier<typeof SkipNavService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const AppScreenBootstrap = AppScreenBootstrapDI;
