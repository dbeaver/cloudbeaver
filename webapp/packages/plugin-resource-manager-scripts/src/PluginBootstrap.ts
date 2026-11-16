/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { UserInfoResource } from '@cloudbeaver/core-authentication';
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, Context, disposeService, Effect, Layer } from '@cloudbeaver/core-di';
import { getCachedDataResourceLoaderState } from '@cloudbeaver/core-resource';
import { SideBarPanelService } from '@cloudbeaver/core-ui';
import { ActionService, menuExtractItems, MenuService } from '@cloudbeaver/core-view';
import { MENU_TOOLS } from '@cloudbeaver/plugin-tools-panel';

import { ACTION_RESOURCE_MANAGER_SCRIPTS } from './Actions/ACTION_RESOURCE_MANAGER_SCRIPTS.js';
import { ResourceManagerScriptsService, SCRIPTS_TAB_ID } from './ResourceManagerScriptsService.js';

const ResourceManagerScripts = importLazyComponent(() => import('./ResourceManagerScripts.js').then(m => m.ResourceManagerScripts));

export class PluginBootstrapImpl extends Bootstrap {
  constructor(
    private readonly userInfoResource: UserInfoResource,
    private readonly sideBarPanelService: SideBarPanelService,
    private readonly resourceManagerScriptsService: ResourceManagerScriptsService,
    private readonly menuService: MenuService,
    private readonly actionService: ActionService,
  ) {
    super();
  }

  override register(): void | Promise<void> {
    this.registerMenu();
    this.sideBarPanelService.tabsContainer.add({
      key: SCRIPTS_TAB_ID,
      order: 0,
      name: 'plugin_resource_manager_scripts_title',
      isHidden: () => !this.resourceManagerScriptsService.active,
      getLoader: () => [getCachedDataResourceLoaderState(this.userInfoResource, () => undefined)],
      onClose: this.resourceManagerScriptsService.togglePanel,
      panel: () => ResourceManagerScripts,
    });
  }

  private registerMenu() {
    this.menuService.addCreator({
      menus: [MENU_TOOLS],
      getItems: (context, items) => [...items, ACTION_RESOURCE_MANAGER_SCRIPTS],
      orderItems: (context, items) => {
        items.unshift(...menuExtractItems(items, [ACTION_RESOURCE_MANAGER_SCRIPTS]));
        return items;
      },
    });

    this.actionService.addHandler({
      id: 'resource-manager-scripts-base',
      actions: [ACTION_RESOURCE_MANAGER_SCRIPTS],
      isHidden: () => !this.resourceManagerScriptsService.enabled,
      isChecked: () => this.resourceManagerScriptsService.active,
      getLoader: () => [getCachedDataResourceLoaderState(this.userInfoResource, () => undefined)],
      handler: (context, action) => {
        switch (action) {
          case ACTION_RESOURCE_MANAGER_SCRIPTS: {
            this.resourceManagerScriptsService.togglePanel();
            break;
          }
        }
      },
    });
  }
}

export type PluginBootstrap = PluginBootstrapImpl;

export class PluginBootstrapDI extends Context.Service<PluginBootstrapDI, PluginBootstrapImpl>()(
  '@cloudbeaver/plugin-resource-manager-scripts/PluginBootstrap#PluginBootstrap',
) {
  static readonly implementation = PluginBootstrapImpl;

  static readonly dependencies = () => [UserInfoResource, SideBarPanelService, ResourceManagerScriptsService, MenuService, ActionService] as const;
  static readonly make: Effect.Effect<
    PluginBootstrapImpl,
    never,
    | Context.Service.Identifier<typeof UserInfoResource>
    | Context.Service.Identifier<typeof SideBarPanelService>
    | Context.Service.Identifier<typeof ResourceManagerScriptsService>
    | Context.Service.Identifier<typeof MenuService>
    | Context.Service.Identifier<typeof ActionService>
  > = Effect.gen(function* makePluginBootstrap() {
    const userInfoResource = yield* UserInfoResource;
    const sideBarPanelService = yield* SideBarPanelService;
    const resourceManagerScriptsService = yield* ResourceManagerScriptsService;
    const menuService = yield* MenuService;
    const actionService = yield* ActionService;

    return new PluginBootstrapImpl(userInfoResource, sideBarPanelService, resourceManagerScriptsService, menuService, actionService);
  });
  static readonly layer: Layer.Layer<
    PluginBootstrapDI,
    never,
    | Context.Service.Identifier<typeof UserInfoResource>
    | Context.Service.Identifier<typeof SideBarPanelService>
    | Context.Service.Identifier<typeof ResourceManagerScriptsService>
    | Context.Service.Identifier<typeof MenuService>
    | Context.Service.Identifier<typeof ActionService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const PluginBootstrap = PluginBootstrapDI;
