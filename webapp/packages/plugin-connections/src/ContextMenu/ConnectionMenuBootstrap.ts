/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { EAdminPermission } from '@cloudbeaver/core-authentication';
import { Connection, ConnectionInfoResource, ConnectionsManagerService, ConnectionsSettingsService, createConnectionParam } from '@cloudbeaver/core-connections';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { DATA_CONTEXT_NAV_NODE, EObjectFeature, NavNodeManagerService } from '@cloudbeaver/core-navigation-tree';
import { CONNECTION_NAVIGATOR_VIEW_SETTINGS, isNavigatorViewSettingsEqual, NavigatorViewSettings, PermissionsService, ServerConfigResource } from '@cloudbeaver/core-root';
import { getCachedMapResourceLoaderState } from '@cloudbeaver/core-sdk';
import { ActionService, ACTION_DELETE, DATA_CONTEXT_LOADABLE_STATE, DATA_CONTEXT_MENU, DATA_CONTEXT_MENU_NESTED, MenuSeparatorItem, MenuService } from '@cloudbeaver/core-view';
import { MENU_APP_ACTIONS } from '@cloudbeaver/plugin-top-app-bar';

import { ConnectionAuthService } from '../ConnectionAuthService';
import { PluginConnectionsSettingsService } from '../PluginConnectionsSettingsService';
import { PublicConnectionFormService } from '../PublicConnectionForm/PublicConnectionFormService';
import { ACTION_CONNECTION_CHANGE_CREDENTIALS } from './Actions/ACTION_CONNECTION_CHANGE_CREDENTIALS';
import { ACTION_CONNECTION_DISCONNECT } from './Actions/ACTION_CONNECTION_DISCONNECT';
import { ACTION_CONNECTION_DISCONNECT_ALL } from './Actions/ACTION_CONNECTION_DISCONNECT_ALL';
import { ACTION_CONNECTION_EDIT } from './Actions/ACTION_CONNECTION_EDIT';
import { ACTION_CONNECTION_VIEW_ADVANCED } from './Actions/ACTION_CONNECTION_VIEW_ADVANCED';
import { ACTION_CONNECTION_VIEW_SIMPLE } from './Actions/ACTION_CONNECTION_VIEW_SIMPLE';
import { ACTION_CONNECTION_VIEW_SYSTEM_OBJECTS } from './Actions/ACTION_CONNECTION_VIEW_SYSTEM_OBJECTS';
import { DATA_CONTEXT_CONNECTION } from './DATA_CONTEXT_CONNECTION';
import { MENU_CONNECTION_VIEW } from './MENU_CONNECTION_VIEW';
import { MENU_CONNECTIONS } from './MENU_CONNECTIONS';

@injectable()
export class ConnectionMenuBootstrap extends Bootstrap {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly connectionInfoResource: ConnectionInfoResource,
    private readonly navNodeManagerService: NavNodeManagerService,
    private readonly connectionsManagerService: ConnectionsManagerService,
    private readonly actionService: ActionService,
    private readonly menuService: MenuService,
    private readonly publicConnectionFormService: PublicConnectionFormService,
    private readonly connectionsSettingsService: ConnectionsSettingsService,
    private readonly pluginConnectionsSettingsService: PluginConnectionsSettingsService,
    private readonly permissionsService: PermissionsService,
    private readonly connectionAuthService: ConnectionAuthService,
    private readonly serverConfigResource: ServerConfigResource,
  ) {
    super();
  }

  register(): void | Promise<void> {
    this.addConnectionsMenuToTopAppBar();

    this.menuService.addCreator({
      isApplicable: context => {
        if (
          this.pluginConnectionsSettingsService.settings.getValue('hideConnectionViewForUsers')
          && !this.permissionsService.has(EAdminPermission.admin)
        ) {
          return false;
        }

        const connection = context.tryGet(DATA_CONTEXT_CONNECTION);

        if (!connection?.connected) {
          return false;
        }

        const node = context.tryGet(DATA_CONTEXT_NAV_NODE);

        if (node && !node.objectFeatures.includes(EObjectFeature.dataSource)) {
          return false;
        }

        return (
          context.has(DATA_CONTEXT_CONNECTION)
          && !context.has(DATA_CONTEXT_MENU_NESTED)
        );
      },
      getItems: (context, items) => [
        ...items,
        MENU_CONNECTION_VIEW,
      ],
    });

    this.menuService.addCreator({
      isApplicable: context => {
        const menu = context.tryGet(DATA_CONTEXT_MENU);

        return menu === MENU_CONNECTION_VIEW;
      },
      getItems: (context, items) => [
        ...items,
        ACTION_CONNECTION_VIEW_SIMPLE,
        ACTION_CONNECTION_VIEW_ADVANCED,
        new MenuSeparatorItem(),
        ACTION_CONNECTION_VIEW_SYSTEM_OBJECTS,
      ],
    });

    this.actionService.addHandler({
      id: 'connection-view',
      isActionApplicable: (context, action) => [
        ACTION_CONNECTION_VIEW_SIMPLE,
        ACTION_CONNECTION_VIEW_ADVANCED,
        ACTION_CONNECTION_VIEW_SYSTEM_OBJECTS,
      ].includes(action),
      isChecked: (context, action) => {
        const connection = context.get(DATA_CONTEXT_CONNECTION);

        switch (action) {
          case ACTION_CONNECTION_VIEW_SIMPLE: {
            return isNavigatorViewSettingsEqual(
              connection.navigatorSettings,
              CONNECTION_NAVIGATOR_VIEW_SETTINGS.simple
            );
          }
          case ACTION_CONNECTION_VIEW_ADVANCED: {
            return isNavigatorViewSettingsEqual(
              connection.navigatorSettings,
              CONNECTION_NAVIGATOR_VIEW_SETTINGS.advanced
            );
          }
          case ACTION_CONNECTION_VIEW_SYSTEM_OBJECTS: {
            return connection.navigatorSettings.showSystemObjects;
          }
        }

        return false;
      },
      handler: async (context, action) => {
        const connection = context.get(DATA_CONTEXT_CONNECTION);

        switch (action) {
          case ACTION_CONNECTION_VIEW_SIMPLE: {
            await this.changeConnectionView(connection, CONNECTION_NAVIGATOR_VIEW_SETTINGS.simple);
            break;
          }
          case ACTION_CONNECTION_VIEW_ADVANCED: {
            await this.changeConnectionView(connection, CONNECTION_NAVIGATOR_VIEW_SETTINGS.advanced);
            break;
          }
          case ACTION_CONNECTION_VIEW_SYSTEM_OBJECTS: {
            const currentSettings = connection.navigatorSettings;

            await this.changeConnectionView(connection, {
              ...currentSettings,
              showSystemObjects: !currentSettings.showSystemObjects,
            });
            break;
          }
        }
      },
    });

    this.menuService.addCreator({
      isApplicable: context => context.has(DATA_CONTEXT_CONNECTION) && !context.has(DATA_CONTEXT_MENU_NESTED),
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
      isActionApplicable: (context, action) => {
        const connection = context.tryGet(DATA_CONTEXT_CONNECTION);

        if (!connection) {
          return false;
        }
        const node = context.tryGet(DATA_CONTEXT_NAV_NODE);

        if (node && !node.objectFeatures.includes(EObjectFeature.dataSource)) {
          return false;
        }

        if (action === ACTION_CONNECTION_DISCONNECT) {
          return connection.connected;
        }

        if (action === ACTION_CONNECTION_DISCONNECT_ALL) {
          return this.connectionsManagerService.hasAnyConnection(true);
        }

        if (action === ACTION_DELETE) {
          return connection.canDelete;
        }

        if (action === ACTION_CONNECTION_EDIT) {
          return connection.canEdit || connection.canViewSettings;
        }

        if (action === ACTION_CONNECTION_CHANGE_CREDENTIALS) {
          return this.serverConfigResource.distributed && connection.credentialsSaved === true;
        }

        return false;
      },
      getLoader: (context, action) => {
        const state = context.get(DATA_CONTEXT_LOADABLE_STATE);
        const connection = context.get(DATA_CONTEXT_CONNECTION);

        return state.getState(
          action.id,
          () => getCachedMapResourceLoaderState(this.connectionInfoResource, createConnectionParam(connection), ['includeCredentialsSaved'], true)
        );
      },
      handler: async (context, action) => {
        const connection = context.get(DATA_CONTEXT_CONNECTION);

        switch (action) {
          case ACTION_CONNECTION_DISCONNECT: {
            await this.connectionsManagerService.closeConnectionAsync(
              createConnectionParam(connection)
            );
            break;
          }
          case ACTION_CONNECTION_DISCONNECT_ALL: {
            await this.connectionsManagerService.closeAllConnections();
            break;
          }
          case ACTION_DELETE: {
            try {
              await this.connectionsManagerService.deleteConnection(
                createConnectionParam(connection)
              );
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
            await this.connectionAuthService.auth(
              { connectionId: connection.id, projectId: connection.projectId },
              true
            );
            break;
          }
        }
      },
    });
  }

  load(): void { }

  private async changeConnectionView(connection: Connection, settings: NavigatorViewSettings) {
    try {
      connection = await this.connectionInfoResource.changeConnectionView(
        createConnectionParam(connection),
        settings
      );

      if (connection.nodePath) {
        await this.navNodeManagerService.refreshTree(connection.nodePath);
      }
    } catch (exception: any) {
      this.notificationService.logException(exception);
    }
  }

  private addConnectionsMenuToTopAppBar() {
    this.menuService.addCreator({
      menus: [MENU_APP_ACTIONS],
      getItems: (context, items) => [
        ...items,
        MENU_CONNECTIONS,
      ],
    });
    this.menuService.setHandler({
      id: 'connections-menu-base',
      isApplicable: context => context.tryGet(DATA_CONTEXT_MENU) === MENU_CONNECTIONS,
      isHidden: () => this.connectionsManagerService.createConnectionProjects.length === 0 || this.connectionsSettingsService.settings.getValue('disabled'),
      isLabelVisible: () => false,
    });
  }
}
