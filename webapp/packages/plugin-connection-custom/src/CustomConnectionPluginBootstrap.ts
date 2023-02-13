/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ConnectionsManagerService } from '@cloudbeaver/core-connections';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { CommonDialogService } from '@cloudbeaver/core-dialogs';
import { ProjectInfoResource } from '@cloudbeaver/core-projects';
import { CachedMapAllKey, getCachedMapResourceLoaderState } from '@cloudbeaver/core-sdk';
import { ActionService, DATA_CONTEXT_LOADABLE_STATE, MenuService } from '@cloudbeaver/core-view';
import { MENU_CONNECTIONS } from '@cloudbeaver/plugin-connections';

import { ACTION_CONNECTION_CUSTOM } from './Actions/ACTION_CONNECTION_CUSTOM';
import { CustomConnectionDialog } from './CustomConnection/CustomConnectionDialog';
import { CustomConnectionSettingsService } from './CustomConnectionSettingsService';

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

  register(): void | Promise<void> {
    this.menuService.addCreator({
      menus: [MENU_CONNECTIONS],
      getItems: (context, items) => [
        ...items,
        ACTION_CONNECTION_CUSTOM,
      ],
    });

    this.actionService.addHandler({
      id: 'connection-custom',
      isActionApplicable: (context, action) => [
        ACTION_CONNECTION_CUSTOM,
      ].includes(action),
      isHidden: (context, action) => {
        if (this.connectionsManagerService.createConnectionProjects.length === 0) {
          return true;
        }

        if (action === ACTION_CONNECTION_CUSTOM) {
          return this.customConnectionSettingsService.settings.getValue('disabled');
        }

        return false;
      },
      getLoader: (context, action) => {
        const state = context.get(DATA_CONTEXT_LOADABLE_STATE);

        return state.getState(
          action.id,
          () => getCachedMapResourceLoaderState(this.projectInfoResource, CachedMapAllKey)
        );
      },
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

  load(): void | Promise<void> { }

  private async openConnectionsDialog() {
    await this.commonDialogService.open(CustomConnectionDialog, null);
  }
}
