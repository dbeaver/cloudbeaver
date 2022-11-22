/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import { getCachedDataResourceLoaderState } from '@cloudbeaver/core-sdk';
import { SideBarPanelService } from '@cloudbeaver/core-ui';
import { ActionService, DATA_CONTEXT_LOADABLE_STATE, DATA_CONTEXT_MENU, menuExtractItems, MenuService } from '@cloudbeaver/core-view';
import { MENU_TOOLS } from '@cloudbeaver/plugin-tools-panel';

import { ACTION_RESOURCE_MANAGER } from './Actions/ACTION_RESOURCE_MANAGER';
import { ResourceManager } from './ResourceManager';
import { ResourceManagerService } from './ResourceManagerService';

@injectable()
export class PluginBootstrap extends Bootstrap {
  constructor(
    private readonly resourceManagerService: ResourceManagerService,
    private readonly sideBarPanelService: SideBarPanelService,
    private readonly menuService: MenuService,
    private readonly actionService: ActionService,
    private readonly serverConfigResource: ServerConfigResource
  ) {
    super();
  }

  register(): void | Promise<void> {
    this.menuService.addCreator({
      isApplicable: context => context.tryGet(DATA_CONTEXT_MENU) === MENU_TOOLS,
      getItems: (context, items) => [
        ...items,
        ACTION_RESOURCE_MANAGER,
      ],
      orderItems: (context, items) => {
        const extracted = menuExtractItems(items, [ACTION_RESOURCE_MANAGER]);
        return [...extracted, ...items];
      },
    });

    this.actionService.addHandler({
      id: 'resource-manager-base',
      isActionApplicable: (context, action) => [
        ACTION_RESOURCE_MANAGER,
      ].includes(action),
      isHidden: () => !this.resourceManagerService.enabled,
      isChecked: () => this.resourceManagerService.active,
      getLoader: (context, action) => {
        const state = context.get(DATA_CONTEXT_LOADABLE_STATE);

        return state.getState(
          action.id,
          () => getCachedDataResourceLoaderState(this.serverConfigResource, undefined, undefined)
        );
      },
      handler: (context, action) => {
        switch (action) {
          case ACTION_RESOURCE_MANAGER: {
            this.resourceManagerService.togglePanel();
            break;
          }
        }
      },
    });

    this.sideBarPanelService.tabsContainer.add({
      key: 'resource-manager-tab',
      order: 0,
      name: 'plugin_resource_manager_title',
      isHidden: () => !this.resourceManagerService.active,
      onClose: this.resourceManagerService.togglePanel,
      panel: () => ResourceManager,
    });
  }

  async load(): Promise<void> { }
}