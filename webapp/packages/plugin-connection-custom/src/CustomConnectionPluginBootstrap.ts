/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { ConnectionsManagerService } from '@cloudbeaver/core-connections';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { CommonDialogService } from '@cloudbeaver/core-dialogs';
import { ProjectInfoResource } from '@cloudbeaver/core-projects';
import { CachedMapAllKey, getCachedMapResourceLoaderState } from '@cloudbeaver/core-resource';
import { ActionService, MenuService } from '@cloudbeaver/core-view';
import { ACTION_CREATE_CONNECTION, MENU_CONNECTIONS } from '@cloudbeaver/plugin-connections';
import { MENU_NAVIGATION_TREE_CREATE } from '@cloudbeaver/plugin-navigation-tree';

import { ACTION_CONNECTION_CUSTOM } from './Actions/ACTION_CONNECTION_CUSTOM.js';
import { CustomConnectionSettingsService } from './CustomConnectionSettingsService.js';

const DriverSelectorDialog = importLazyComponent(() => import('./DriverSelector/DriverSelectorDialog.js').then(m => m.DriverSelectorDialog));

@injectable()
export class CustomConnectionPluginBootstrap extends Bootstrap {
  constructor(
    private readonly commonDialogService: CommonDialogService,
    private readonly projectInfoResource: ProjectInfoResource,
    private readonly menuService: MenuService,
    private readonly actionService: ActionService,
    private readonly connectionsManagerService: ConnectionsManagerService,
    private readonly customConnectionSettingsService: CustomConnectionSettingsService,
  ) {
    super();
  }

  override register(): void | Promise<void> {
    this.menuService.addCreator({
      menus: [MENU_CONNECTIONS],
      getItems: (context, items) => [...items, ACTION_CONNECTION_CUSTOM],
    });

    this.menuService.addCreator({
      menus: [MENU_NAVIGATION_TREE_CREATE],
      isApplicable: context => !this.isHidden(true),
      getItems: (context, items) => [...items, ACTION_CREATE_CONNECTION],
    });

    this.actionService.addHandler({
      id: 'nav-tree-create-create-connection-handler',
      menus: [MENU_NAVIGATION_TREE_CREATE],
      actions: [ACTION_CREATE_CONNECTION],
      handler: async (context, action) => {
        if (action === ACTION_CREATE_CONNECTION) {
          await this.openConnectionsDialog();
        }
      },
    });

    this.actionService.addHandler({
      id: 'connection-custom',
      actions: [ACTION_CONNECTION_CUSTOM],
      isHidden: (context, action) => this.isHidden(action === ACTION_CONNECTION_CUSTOM),
      getLoader: (context, action) => getCachedMapResourceLoaderState(this.projectInfoResource, () => CachedMapAllKey),
      handler: async (context, action) => {
        switch (action) {
          case ACTION_CONNECTION_CUSTOM: {
            await this.openConnectionsDialog();
            break;
          }
        }
      },
    });
  }

  private isHidden(hasSettings: boolean) {
    if (this.connectionsManagerService.createConnectionProjects.length === 0) {
      return true;
    }

    if (hasSettings) {
      return this.customConnectionSettingsService.disabled;
    }

    return false;
  }

  private async openConnectionsDialog() {
    await this.commonDialogService.open(DriverSelectorDialog, null);
  }
}
