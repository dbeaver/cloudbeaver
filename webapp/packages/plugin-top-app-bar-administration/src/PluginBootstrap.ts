/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { AdministrationTopAppBarService } from '@cloudbeaver/plugin-administration';

import { importLazyComponent } from '@cloudbeaver/core-blocks';

const AdminTopNavBar = importLazyComponent(() => import('./TopNavBar/AdminTopNavBar.js').then(m => m.AdminTopNavBar));

export class PluginBootstrapImpl extends Bootstrap {
  constructor(private readonly administrationTopAppBarService: AdministrationTopAppBarService) {
    super();
  }

  override register(): void | Promise<void> {
    this.administrationTopAppBarService.navBarPlaceholder.add(AdminTopNavBar);
  }
}

export type PluginBootstrap = PluginBootstrapImpl;

export class PluginBootstrapDI extends Context.Service<PluginBootstrapDI, PluginBootstrapImpl>()(
  '@cloudbeaver/plugin-top-app-bar-administration/PluginBootstrap#PluginBootstrap',
) {
  static readonly implementation = PluginBootstrapImpl;

  static readonly dependencies = () => [AdministrationTopAppBarService] as const;
  static readonly make: Effect.Effect<PluginBootstrapImpl, never, Context.Service.Identifier<typeof AdministrationTopAppBarService>> = Effect.gen(
    function* makePluginBootstrap() {
      const administrationTopAppBarService = yield* AdministrationTopAppBarService;

      return new PluginBootstrapImpl(administrationTopAppBarService);
    },
  );
  static readonly layer: Layer.Layer<PluginBootstrapDI, never, Context.Service.Identifier<typeof AdministrationTopAppBarService>> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const PluginBootstrap = PluginBootstrapDI;
