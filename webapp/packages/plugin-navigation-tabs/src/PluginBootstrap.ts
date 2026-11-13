/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { AppScreenService } from '@cloudbeaver/core-app';
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { NavigationTabsSettingsService } from './NavigationTabs/NavigationTabsSettingsService.js';

const NavigationTabsBar = importLazyComponent(() => import('./NavigationTabs/NavigationTabsBar/index.js').then(m => m.NavigationTabsBar));

export class PluginBootstrapImpl extends Bootstrap {
  constructor(
    private readonly appScreenService: AppScreenService,
    private readonly navigationTabsSettingsService: NavigationTabsSettingsService,
  ) {
    super();
  }

  override register(): void | Promise<void> {
    this.appScreenService.rightAreaTop.add(NavigationTabsBar);
    this.navigationTabsSettingsService.registerSettingsUI();
  }
}

export type PluginBootstrap = PluginBootstrapImpl;

export class PluginBootstrapDI extends Context.Service<PluginBootstrapDI, PluginBootstrapImpl>()(
  '@cloudbeaver/plugin-navigation-tabs/PluginBootstrap#PluginBootstrap',
) {
  static readonly implementation = PluginBootstrapImpl;

  static readonly dependencies = () => [AppScreenService, NavigationTabsSettingsService] as const;
  static readonly make: Effect.Effect<
    PluginBootstrapImpl,
    never,
    Context.Service.Identifier<typeof AppScreenService> | Context.Service.Identifier<typeof NavigationTabsSettingsService>
  > = Effect.gen(function* makePluginBootstrap() {
    const appScreenService = yield* AppScreenService;
    const navigationTabsSettingsService = yield* NavigationTabsSettingsService;

    return new PluginBootstrapImpl(appScreenService, navigationTabsSettingsService);
  });
  static readonly layer: Layer.Layer<
    PluginBootstrapDI,
    never,
    Context.Service.Identifier<typeof AppScreenService> | Context.Service.Identifier<typeof NavigationTabsSettingsService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const PluginBootstrap = PluginBootstrapDI;
