/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { AppScreenService } from '@cloudbeaver/core-app';
import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';

import { PublicTopNavBar } from './TopNavBar/PublicTopNavBar.js';

export class PluginBootstrapImpl extends Bootstrap {
  constructor(private readonly appScreenService: AppScreenService) {
    super();
  }

  override register(): void | Promise<void> {
    this.appScreenService.placeholder.add(PublicTopNavBar);
  }
}

export type PluginBootstrap = PluginBootstrapImpl;

export class PluginBootstrapDI extends Context.Service<PluginBootstrapDI, PluginBootstrapImpl>()(
  '@cloudbeaver/plugin-top-app-bar/PluginBootstrap#PluginBootstrap',
) {
  static readonly implementation = PluginBootstrapImpl;

  static readonly dependencies = () => [AppScreenService] as const;
  static readonly make: Effect.Effect<PluginBootstrapImpl, never, Context.Service.Identifier<typeof AppScreenService>> = Effect.gen(
    function* makePluginBootstrap() {
      const appScreenService = yield* AppScreenService;

      return new PluginBootstrapImpl(appScreenService);
    },
  );
  static readonly layer: Layer.Layer<PluginBootstrapDI, never, Context.Service.Identifier<typeof AppScreenService>> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const PluginBootstrap = PluginBootstrapDI;
