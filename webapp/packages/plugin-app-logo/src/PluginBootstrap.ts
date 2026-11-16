/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { TopNavService } from '@cloudbeaver/plugin-top-app-bar';
import { LogoLazy } from './LogoLazy.js';

export class AppLogoPluginBootstrapImpl extends Bootstrap {
  constructor(private readonly topNavService: TopNavService) {
    super();
  }

  override register() {
    this.topNavService.placeholder.add(LogoLazy, 0);
  }
}

export type AppLogoPluginBootstrap = AppLogoPluginBootstrapImpl;

export class AppLogoPluginBootstrapDI extends Context.Service<AppLogoPluginBootstrapDI, AppLogoPluginBootstrapImpl>()(
  '@cloudbeaver/plugin-app-logo/PluginBootstrap#AppLogoPluginBootstrap',
) {
  static readonly implementation = AppLogoPluginBootstrapImpl;

  static readonly dependencies = () => [TopNavService] as const;
  static readonly make: Effect.Effect<AppLogoPluginBootstrapImpl, never, Context.Service.Identifier<typeof TopNavService>> = Effect.gen(
    function* makeAppLogoPluginBootstrap() {
      const topNavService = yield* TopNavService;

      return new AppLogoPluginBootstrapImpl(topNavService);
    },
  );
  static readonly layer: Layer.Layer<AppLogoPluginBootstrapDI, never, Context.Service.Identifier<typeof TopNavService>> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const AppLogoPluginBootstrap = AppLogoPluginBootstrapDI;
