/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { SideBarPanelService } from '@cloudbeaver/core-ui';
import { EMainMenu, MainMenuService } from '@cloudbeaver/plugin-top-app-bar';

import { ResourceManager } from './ResourceManager';
import { ResourceManagerService } from './ResourceManagerService';

@injectable()
export class PluginBootstrap extends Bootstrap {
  constructor(
    private readonly mainMenuService: MainMenuService,
    private readonly resourceManagerService: ResourceManagerService,
    private readonly sideBarPanelService: SideBarPanelService,
  ) {
    super();
  }

  register(): void | Promise<void> {
    this.mainMenuService.registerMenuItem(
      EMainMenu.mainMenuToolsPanel,
      {
        id: 'resourceManagementTrigger',
        order: 3,
        type: 'checkbox',
        title: 'plugin_resource_manager_title',
        isHidden: () => !this.resourceManagerService.enabled,
        isChecked: () => this.resourceManagerService.active,
        onClick: this.resourceManagerService.togglePanel,
      }
    );

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