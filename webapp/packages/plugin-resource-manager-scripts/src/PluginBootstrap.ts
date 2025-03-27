/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { getCachedDataResourceLoaderState } from '@cloudbeaver/core-resource';
import { UserInfoResource } from '@cloudbeaver/core-authentication';
import { SideBarPanelService } from '@cloudbeaver/core-ui';
import { ActionService, menuExtractItems, MenuService } from '@cloudbeaver/core-view';
import { MENU_TOOLS } from '@cloudbeaver/plugin-tools-panel';

import { ACTION_RESOURCE_MANAGER_SCRIPTS } from './Actions/ACTION_RESOURCE_MANAGER_SCRIPTS.js';
import { ResourceManagerScriptsService } from './ResourceManagerScriptsService.js';

const ResourceManagerScripts = importLazyComponent(() => import('./ResourceManagerScripts.js').then(m => m.ResourceManagerScripts));

@injectable()
export class PluginBootstrap extends Bootstrap {
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
      key: 'resource-manager-scripts-tab',
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
        const extracted = menuExtractItems(items, [ACTION_RESOURCE_MANAGER_SCRIPTS]);
        return [...extracted, ...items];
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
