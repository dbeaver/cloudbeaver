/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { ConnectionsManagerService } from '@cloudbeaver/core-connections';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { ProjectInfoResource } from '@cloudbeaver/core-projects';
import { CachedMapAllKey, getCachedMapResourceLoaderState } from '@cloudbeaver/core-resource';
import { EAdminPermission, PermissionsService } from '@cloudbeaver/core-root';
import { ActionService, MenuService } from '@cloudbeaver/core-view';
import { MENU_CONNECTIONS, MENU_TREE_CREATE_CONNECTION } from '@cloudbeaver/plugin-connections';

import { ACTION_CONNECTION_SEARCH } from './Actions/ACTION_CONNECTION_SEARCH.js';
import { ConnectionSearchSettingsService } from './ConnectionSearchSettingsService.js';
import { ConnectionSearchService } from './Search/ConnectionSearchService.js';

@injectable()
export class SearchConnectionPluginBootstrap extends Bootstrap {
  constructor(
    private readonly permissionsService: PermissionsService,
    private readonly projectInfoResource: ProjectInfoResource,
    private readonly connectionSearchService: ConnectionSearchService,
    private readonly connectionsManagerService: ConnectionsManagerService,
    private readonly menuService: MenuService,
    private readonly actionService: ActionService,
    private readonly connectionSearchSettingsService: ConnectionSearchSettingsService,
  ) {
    super();
  }

  override register(): void | Promise<void> {
    this.menuService.addCreator({
      menus: [MENU_CONNECTIONS, MENU_TREE_CREATE_CONNECTION],
      getItems: (context, items) => [...items, ACTION_CONNECTION_SEARCH],
    });

    this.actionService.addHandler({
      id: 'connection-search',
      actions: [ACTION_CONNECTION_SEARCH],
      isHidden: (context, action) => {
        if (this.connectionsManagerService.createConnectionProjects.length === 0 || !this.permissionsService.has(EAdminPermission.admin)) {
          return true;
        }

        if (action === ACTION_CONNECTION_SEARCH) {
          return this.connectionSearchSettingsService.disabled;
        }

        return false;
      },
      getLoader: () => getCachedMapResourceLoaderState(this.projectInfoResource, () => CachedMapAllKey),
      handler: (context, action) => {
        switch (action) {
          case ACTION_CONNECTION_SEARCH: {
            this.connectionSearchService.open();
            break;
          }
        }
      },
    });
  }
}
