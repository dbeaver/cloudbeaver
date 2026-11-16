/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap, Context, disposeService, Effect, Layer } from '@cloudbeaver/core-di';
import { menuExtractItems, MenuService } from '@cloudbeaver/core-view';
import { MENU_APP_STATE } from '@cloudbeaver/plugin-top-app-bar';

import { TOP_NAV_BAR_SETTINGS_MENU } from './SettingsMenu/TOP_NAV_BAR_SETTINGS_MENU.js';

export class PluginBootstrapImpl extends Bootstrap {
  constructor(private readonly menuService: MenuService) {
    super();
  }

  override register(): void {
    this.addTopAppMenuItems();
  }

  private addTopAppMenuItems() {
    this.menuService.addCreator({
      menus: [MENU_APP_STATE],
      getItems: (context, items) => [...items, TOP_NAV_BAR_SETTINGS_MENU],
      orderItems: (context, items) => {
        items.push(...menuExtractItems(items, [TOP_NAV_BAR_SETTINGS_MENU]));
        return items;
      },
    });
  }
}

export type PluginBootstrap = PluginBootstrapImpl;

export class PluginBootstrapDI extends Context.Service<PluginBootstrapDI, PluginBootstrapImpl>()(
  '@cloudbeaver/plugin-settings-menu/PluginBootstrap#PluginBootstrap',
) {
  static readonly implementation = PluginBootstrapImpl;

  static readonly dependencies = () => [MenuService] as const;
  static readonly make: Effect.Effect<PluginBootstrapImpl, never, Context.Service.Identifier<typeof MenuService>> = Effect.gen(
    function* makePluginBootstrap() {
      const menuService = yield* MenuService;

      return new PluginBootstrapImpl(menuService);
    },
  );
  static readonly layer: Layer.Layer<PluginBootstrapDI, never, Context.Service.Identifier<typeof MenuService>> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const PluginBootstrap = PluginBootstrapDI;
