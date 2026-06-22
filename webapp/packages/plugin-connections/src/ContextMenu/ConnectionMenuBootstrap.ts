/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import {
  ConnectionInfoAuthPropertiesResource,
  ConnectionInfoProjectKey,
  ConnectionInfoResource,
  ConnectionsManagerService,
  ConnectionsSettingsService,
  createConnectionParam,
  DATA_CONTEXT_CONNECTION,
} from '@cloudbeaver/core-connections';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { LocalizationService } from '@cloudbeaver/core-localization';
import { NotificationService } from '@cloudbeaver/core-events';
import { DATA_CONTEXT_NAV_NODE, EObjectFeature, NavTreeSettingsService } from '@cloudbeaver/core-navigation-tree';
import { getCachedMapResourceLoaderState } from '@cloudbeaver/core-resource';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import { getUniqueName } from '@cloudbeaver/core-utils';
import { ACTION_DELETE, ActionService, menuExtractItems, MenuSeparatorItem, MenuService } from '@cloudbeaver/core-view';
import { MENU_APP_ACTIONS } from '@cloudbeaver/plugin-top-app-bar';

import { PublicConnectionFormService } from '../PublicConnectionForm/PublicConnectionFormService.js';
import { ACTION_CONNECTION_CHANGE_CREDENTIALS } from './Actions/ACTION_CONNECTION_CHANGE_CREDENTIALS.js';
import { ACTION_CONNECTION_CLONE } from './Actions/ACTION_CONNECTION_CLONE.js';
import { ACTION_CONNECTION_DISCONNECT } from './Actions/ACTION_CONNECTION_DISCONNECT.js';
import { ACTION_CONNECTION_DISCONNECT_ALL } from './Actions/ACTION_CONNECTION_DISCONNECT_ALL.js';
import { ACTION_CONNECTION_EDIT } from './Actions/ACTION_CONNECTION_EDIT.js';
import { MENU_CONNECTIONS } from './MENU_CONNECTIONS.js';
import { MENU_NAVIGATION_TREE_MANAGE } from '@cloudbeaver/plugin-navigation-tree';

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
  LocalizationService,
  NavTreeSettingsService,
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
    private readonly localizationService: LocalizationService,
  ) {
    super();
  }

  override register(): void {
    this.addConnectionsMenuToTopAppBar();

    this.menuService.addCreator({
      menus: [MENU_NAVIGATION_TREE_MANAGE],
      getItems: (context, items) => [...items, ACTION_CONNECTION_EDIT, ACTION_CONNECTION_CLONE],
    });

    this.menuService.addCreator({
      root: true,
      contexts: [DATA_CONTEXT_CONNECTION],
      getItems: (context, items) => [...items, ACTION_CONNECTION_CHANGE_CREDENTIALS, ACTION_CONNECTION_DISCONNECT, ACTION_CONNECTION_DISCONNECT_ALL],
      orderItems(context, items) {
        const disconnect = menuExtractItems(items, [ACTION_CONNECTION_DISCONNECT, ACTION_CONNECTION_DISCONNECT_ALL]);

        if (disconnect.length > 0) {
          return [...items, new MenuSeparatorItem(), ...disconnect];
        }

        return items;
      },
    });

    this.actionService.addHandler({
      id: 'connection-menu-management',
      menus: [MENU_NAVIGATION_TREE_MANAGE],
      actions: [ACTION_CONNECTION_EDIT, ACTION_CONNECTION_CLONE, ACTION_DELETE],
      isActionApplicable: context => {
        const node = context.get(DATA_CONTEXT_NAV_NODE)!;

        return node.objectFeatures.includes(EObjectFeature.dataSource);
      },
      contexts: [DATA_CONTEXT_CONNECTION],
      isHidden: (context, action) => {
        const connectionKey = context.get(DATA_CONTEXT_CONNECTION)!;
        const connection = this.connectionInfoResource.get(connectionKey);

        if (!connection) {
          return true;
        }

        if (action === ACTION_DELETE) {
          return !connection.canDelete;
        }

        if (action === ACTION_CONNECTION_EDIT) {
          return !(connection.canEdit || connection.canViewSettings);
        }

        if (action === ACTION_CONNECTION_CLONE) {
          return !connection.canEdit;
        }

        return true;
      },
      handler: async (context, action) => {
        const connectionKey = context.get(DATA_CONTEXT_CONNECTION)!;
        const connection = await this.connectionInfoResource.load(connectionKey);

        switch (action) {
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
          case ACTION_CONNECTION_CLONE: {
            try {
              // Load all connections for the project first to ensure we have them all to generate a unique name for the cloned connection
              const projectConnections = await this.connectionInfoResource.load(ConnectionInfoProjectKey(connection.projectId));
              const connectionNames = projectConnections.map(connection => connection.name);
              const uniqueName = getUniqueName(
                connection.name.concat(` ${this.localizationService.translate('ui_copy').toLowerCase()}`),
                connectionNames,
              );

              if (!connection.nodePath) {
                this.notificationService.logException(new Error('Connection node path is undefined'), 'plugin_connections_connection_clone_error');
                return;
              }

              await this.connectionInfoResource.createFromNode(connection.projectId, connection.nodePath, uniqueName);
            } catch (exception: any) {
              this.notificationService.logException(exception, 'plugin_connections_connection_clone_error');
            }
            break;
          }
        }
      },
    });

    this.actionService.addHandler({
      id: 'connection-management',
      actions: [ACTION_CONNECTION_CHANGE_CREDENTIALS, ACTION_CONNECTION_DISCONNECT, ACTION_CONNECTION_DISCONNECT_ALL],
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
