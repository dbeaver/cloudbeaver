/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { TopNavService } from '@cloudbeaver/plugin-top-app-bar';

const UserMenu = importLazyComponent(() => import('./UserMenu/UserMenu.js').then(m => m.UserMenu));

export class PluginBootstrapImpl extends Bootstrap {
  constructor(private readonly topNavService: TopNavService) {
    super();
  }

  override register(): void {
    this.topNavService.placeholder.add(UserMenu, 4);
  }
}

export type PluginBootstrap = PluginBootstrapImpl;

export class PluginBootstrapDI extends Context.Service<PluginBootstrapDI, PluginBootstrapImpl>()(
  '@cloudbeaver/plugin-user-profile/PluginBootstrap#PluginBootstrap',
) {
  static readonly implementation = PluginBootstrapImpl;

  static readonly dependencies = () => [TopNavService] as const;
  static readonly make: Effect.Effect<PluginBootstrapImpl, never, Context.Service.Identifier<typeof TopNavService>> = Effect.gen(
    function* makePluginBootstrap() {
      const topNavService = yield* TopNavService;

      return new PluginBootstrapImpl(topNavService);
    },
  );
  static readonly layer: Layer.Layer<PluginBootstrapDI, never, Context.Service.Identifier<typeof TopNavService>> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const PluginBootstrap = PluginBootstrapDI;
