/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { EObjectFeature, NavNodeManagerService, DATA_CONTEXT_NAV_NODE } from '@cloudbeaver/core-app';
import { Connection, ConnectionInfoResource, ConnectionsManagerService, EConnectionFeature } from '@cloudbeaver/core-connections';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { CONNECTION_NAVIGATOR_VIEW_SETTINGS, isNavigatorViewSettingsEqual, NavigatorViewSettings } from '@cloudbeaver/core-root';
import { ActionService, ACTION_DELETE, DATA_CONTEXT_MENU, DATA_CONTEXT_MENU_NESTED, MenuSeparatorItem, MenuService } from '@cloudbeaver/core-view';

import { PublicConnectionFormService } from '../PublicConnectionForm/PublicConnectionFormService';
import { ACTION_CONNECTION_DISCONNECT } from './Actions/ACTION_CONNECTION_DISCONNECT';
import { ACTION_CONNECTION_EDIT } from './Actions/ACTION_CONNECTION_EDIT';
import { ACTION_CONNECTION_VIEW_ADVANCED } from './Actions/ACTION_CONNECTION_VIEW_ADVANCED';
import { ACTION_CONNECTION_VIEW_SIMPLE } from './Actions/ACTION_CONNECTION_VIEW_SIMPLE';
import { ACTION_CONNECTION_VIEW_SYSTEM_OBJECTS } from './Actions/ACTION_CONNECTION_VIEW_SYSTEM_OBJECTS';
import { DATA_CONTEXT_CONNECTION } from './DATA_CONTEXT_CONNECTION';
import { MENU_CONNECTION_VIEW } from './MENU_CONNECTION_VIEW';

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
  ) {
    super();
  }

  register(): void | Promise<void> {
    this.menuService.addCreator({
      isApplicable: context => {
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
        ACTION_CONNECTION_EDIT,
        ACTION_CONNECTION_DISCONNECT,
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

        if (action === ACTION_DELETE) {
          return connection.features.includes(EConnectionFeature.manageable);
        }

        return action === ACTION_CONNECTION_EDIT;
      },
      handler: async (context, action) => {
        const connection = context.get(DATA_CONTEXT_CONNECTION);

        switch (action) {
          case ACTION_CONNECTION_DISCONNECT: {
            await this.connectionsManagerService.closeConnectionAsync(connection.id);
            break;
          }
          case ACTION_DELETE: {
            try {
              await this.connectionsManagerService.deleteConnection(connection.id);
            } catch (exception: any) {
              this.notificationService.logException(exception, 'Failed to delete connection');
            }
            break;
          }
          case ACTION_CONNECTION_EDIT: {
            this.publicConnectionFormService.open({ connectionId: connection.id });
            break;
          }
        }
      },
    });
  }

  load(): void {}

  private async changeConnectionView(connection: Connection, settings: NavigatorViewSettings) {
    try {
      connection = await this.connectionInfoResource.changeConnectionView(connection.id, settings);

      if (connection.nodePath) {
        await this.navNodeManagerService.refreshTree(connection.nodePath);
      }
    } catch (exception: any) {
      this.notificationService.logException(exception);
    }
  }
}
