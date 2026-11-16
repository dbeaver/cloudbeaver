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
import { MenuService } from '@cloudbeaver/core-view';
import { MENU_APP_ACTIONS } from '@cloudbeaver/plugin-top-app-bar';

import { MENU_TOOLS } from './Menu/MENU_TOOLS.js';
import { ToolsPanelService } from './ToolsPanel/ToolsPanelService.js';

const ToolsPanel = importLazyComponent(() => import('./ToolsPanel/ToolsPanel.js').then(module => module.ToolsPanel));

export class PluginBootstrapImpl extends Bootstrap {
  constructor(
    private readonly appScreenService: AppScreenService,
    private readonly menuService: MenuService,
    private readonly toolsPanelService: ToolsPanelService,
  ) {
    super();
  }

  override register(): void {
    this.appScreenService.rightAreaBottom.add(
      ToolsPanel,
      undefined,
      () => this.toolsPanelService.disabled || this.toolsPanelService.tabsContainer.getDisplayed().length === 0,
    );

    this.menuService.addCreator({
      menus: [MENU_APP_ACTIONS],
      getItems: (context, items) => [...items, MENU_TOOLS],
    });

    this.menuService.setHandler({
      id: 'tools-menu-base',
      menus: [MENU_TOOLS],
      isLabelVisible: () => false,
      isHidden: () => this.toolsPanelService.disabled,
    });
  }
}

export type PluginBootstrap = PluginBootstrapImpl;

export class PluginBootstrapDI extends Context.Service<PluginBootstrapDI, PluginBootstrapImpl>()(
  '@cloudbeaver/plugin-tools-panel/PluginBootstrap#PluginBootstrap',
) {
  static readonly implementation = PluginBootstrapImpl;

  static readonly dependencies = () => [AppScreenService, MenuService, ToolsPanelService] as const;
  static readonly make: Effect.Effect<
    PluginBootstrapImpl,
    never,
    | Context.Service.Identifier<typeof AppScreenService>
    | Context.Service.Identifier<typeof MenuService>
    | Context.Service.Identifier<typeof ToolsPanelService>
  > = Effect.gen(function* makePluginBootstrap() {
    const appScreenService = yield* AppScreenService;
    const menuService = yield* MenuService;
    const toolsPanelService = yield* ToolsPanelService;

    return new PluginBootstrapImpl(appScreenService, menuService, toolsPanelService);
  });
  static readonly layer: Layer.Layer<
    PluginBootstrapDI,
    never,
    | Context.Service.Identifier<typeof AppScreenService>
    | Context.Service.Identifier<typeof MenuService>
    | Context.Service.Identifier<typeof ToolsPanelService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const PluginBootstrap = PluginBootstrapDI;
