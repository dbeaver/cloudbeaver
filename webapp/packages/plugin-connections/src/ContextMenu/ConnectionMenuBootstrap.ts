/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import {
  ConnectionInfoAuthPropertiesResource,
  ConnectionInfoResource,
  ConnectionsManagerService,
  ConnectionsSettingsService,
  createConnectionParam,
  DATA_CONTEXT_CONNECTION,
} from '@cloudbeaver/core-connections';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { DATA_CONTEXT_NAV_NODE, EObjectFeature } from '@cloudbeaver/core-navigation-tree';
import { getCachedMapResourceLoaderState } from '@cloudbeaver/core-resource';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import { ACTION_DELETE, ActionService, MenuService } from '@cloudbeaver/core-view';
import { MENU_APP_ACTIONS } from '@cloudbeaver/plugin-top-app-bar';

import { PublicConnectionFormService } from '../PublicConnectionForm/PublicConnectionFormService.js';
import { ACTION_CONNECTION_CHANGE_CREDENTIALS } from './Actions/ACTION_CONNECTION_CHANGE_CREDENTIALS.js';
import { ACTION_CONNECTION_DISCONNECT } from './Actions/ACTION_CONNECTION_DISCONNECT.js';
import { ACTION_CONNECTION_DISCONNECT_ALL } from './Actions/ACTION_CONNECTION_DISCONNECT_ALL.js';
import { ACTION_CONNECTION_EDIT } from './Actions/ACTION_CONNECTION_EDIT.js';
import { MENU_CONNECTIONS } from './MENU_CONNECTIONS.js';

@injectable(() => [
  NotificationService,
  ConnectionInfoResource,
  ConnectionInfoAuthPropertiesResource,
  ConnectionsManagerService,
  ActionService,
  MenuService,
  PublicConnectionFormService,
  ConnectionsSettingsService,
  ServerConfigResource,
])
export class ConnectionMenuBootstrap extends Bootstrap {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly connectionInfoResource: ConnectionInfoResource,
    private readonly connectionInfoAuthPropertiesResource: ConnectionInfoAuthPropertiesResource,
    private readonly connectionsManagerService: ConnectionsManagerService,
    private readonly actionService: ActionService,
    private readonly menuService: MenuService,
    private readonly publicConnectionFormService: PublicConnectionFormService,
    private readonly connectionsSettingsService: ConnectionsSettingsService,
    private readonly serverConfigResource: ServerConfigResource,
  ) {
    super();
  }

  override register(): void {
    this.addConnectionsMenuToTopAppBar();

    this.menuService.addCreator({
      root: true,
      contexts: [DATA_CONTEXT_CONNECTION],
      getItems: (context, items) => [
        ...items,
        ACTION_CONNECTION_CHANGE_CREDENTIALS,
        ACTION_CONNECTION_EDIT,
        ACTION_CONNECTION_DISCONNECT,
        ACTION_CONNECTION_DISCONNECT_ALL,
      ],
    });

    this.actionService.addHandler({
      id: 'connection-management',
      actions: [
        ACTION_DELETE,
        ACTION_CONNECTION_CHANGE_CREDENTIALS,
        ACTION_CONNECTION_EDIT,
        ACTION_CONNECTION_DISCONNECT,
        ACTION_CONNECTION_DISCONNECT_ALL,
      ],
      contexts: [DATA_CONTEXT_CONNECTION, DATA_CONTEXT_NAV_NODE],
      isActionApplicable: context => {
        const node = context.get(DATA_CONTEXT_NAV_NODE)!;

        return node.objectFeatures.includes(EObjectFeature.dataSource);
      },
      isHidden: (context, action) => {
        const connectionKey = context.get(DATA_CONTEXT_CONNECTION)!;
        const connection = this.connectionInfoResource.get(connectionKey);

        if (!connection) {
          return true;
        }

        if (action === ACTION_CONNECTION_DISCONNECT) {
          return !connection.connected;
        }

        if (action === ACTION_CONNECTION_DISCONNECT_ALL) {
          return !this.connectionsManagerService.hasAnyConnection(true);
        }

        if (action === ACTION_DELETE) {
          return !connection.canDelete;
        }

        if (action === ACTION_CONNECTION_EDIT) {
          return !(connection.canEdit || connection.canViewSettings);
        }

        if (action === ACTION_CONNECTION_CHANGE_CREDENTIALS) {
          const auth = this.connectionInfoAuthPropertiesResource.get(connectionKey);
          return !this.serverConfigResource.distributed || !!auth?.sharedCredentials;
        }

        return true;
      },
      getLoader: (context, action) => {
        const connectionKey = context.get(DATA_CONTEXT_CONNECTION)!;
        if (action === ACTION_CONNECTION_CHANGE_CREDENTIALS) {
          return getCachedMapResourceLoaderState(this.connectionInfoAuthPropertiesResource, () => connectionKey, undefined, true);
        }

        return getCachedMapResourceLoaderState(this.connectionInfoResource, () => connectionKey, undefined, true);
      },
      handler: async (context, action) => {
        const connectionKey = context.get(DATA_CONTEXT_CONNECTION)!;
        const connection = await this.connectionInfoResource.load(connectionKey);

        switch (action) {
          case ACTION_CONNECTION_DISCONNECT: {
            await this.connectionsManagerService.closeConnectionAsync(createConnectionParam(connection));
            break;
          }
          case ACTION_CONNECTION_DISCONNECT_ALL: {
            await this.connectionsManagerService.closeAllConnections();
            break;
          }
          case ACTION_DELETE: {
            try {
              await this.connectionsManagerService.deleteConnection(createConnectionParam(connection));
            } catch (exception: any) {
              this.notificationService.logException(exception, 'Failed to delete connection');
            }
            break;
          }
          case ACTION_CONNECTION_EDIT: {
            this.publicConnectionFormService.open(connection.projectId, { connectionId: connection.id });
            break;
          }
          case ACTION_CONNECTION_CHANGE_CREDENTIALS: {
            await this.connectionsManagerService.requireConnection({ connectionId: connection.id, projectId: connection.projectId }, true);
            break;
          }
        }
      },
    });
  }

  private addConnectionsMenuToTopAppBar() {
    this.menuService.addCreator({
      menus: [MENU_APP_ACTIONS],
      getItems: (context, items) => [...items, MENU_CONNECTIONS],
    });
    this.menuService.setHandler({
      id: 'connections-menu-base',
      menus: [MENU_CONNECTIONS],
      isHidden: () => this.connectionsManagerService.createConnectionProjects.length === 0 || this.connectionsSettingsService.disabled,
      isLabelVisible: () => false,
    });
  }
}
