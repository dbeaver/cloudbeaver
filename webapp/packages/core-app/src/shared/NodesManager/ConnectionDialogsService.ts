/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ConnectionInfoResource, ConnectionsManagerService, EConnectionFeature } from '@cloudbeaver/core-connections';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { ContextMenuService } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';

import { EMainMenu, MainMenuService } from '../../TopNavBar/MainMenu/MainMenuService';
import { EObjectFeature } from './EObjectFeature';
import { INodeMenuData, NavNodeContextMenuService } from './NavNodeContextMenuService';
import { NodeManagerUtils } from './NodeManagerUtils';

@injectable()
export class ConnectionDialogsService extends Bootstrap {
  constructor(
    private readonly mainMenuService: MainMenuService,
    private readonly contextMenuService: ContextMenuService,
    private readonly connectionsManagerService: ConnectionsManagerService,
    private readonly connectionInfoResource: ConnectionInfoResource,
    private readonly notificationService: NotificationService,
  ) {
    super();
  }

  register(): void {
    this.mainMenuService.registerMenuItem(
      EMainMenu.mainMenuConnectionsPanel,
      {
        id: 'mainMenuDisconnect',
        order: 3,
        title: 'app_shared_connectionMenu_disconnect',
        onClick: () => this.connectionsManagerService.closeAllConnections(),
        isDisabled: () => !this.connectionsManagerService.hasAnyConnection(true),
      }
    );

    this.contextMenuService.addMenuItem<INodeMenuData>(
      this.contextMenuService.getRootMenuToken(),
      {
        id: 'closeConnection',
        isPresent:
          context => context.contextType === NavNodeContextMenuService.nodeContextType,
        isHidden: context => {
          const connectionId = NodeManagerUtils.connectionNodeIdToConnectionId(context.data.node.id);
          const connection = this.connectionInfoResource.get(connectionId);

          return !context.data.node.objectFeatures.includes(EObjectFeature.dataSource)
            || !connection?.connected;
        },
        title: 'app_navigationTree_context_disconnect',
        onClick: context => {
          const node = context.data.node;
          this.connectionsManagerService.closeConnectionAsync(
            NodeManagerUtils.connectionNodeIdToConnectionId(node.id)
          );
        },
      }
    );

    this.contextMenuService.addMenuItem<INodeMenuData>(
      this.contextMenuService.getRootMenuToken(),
      {
        id: 'deleteConnection',
        isPresent:
          context => context.contextType === NavNodeContextMenuService.nodeContextType,
        isHidden: context => {
          const connectionId = NodeManagerUtils.connectionNodeIdToConnectionId(context.data.node.id);
          const connection = this.connectionInfoResource.get(connectionId);

          return !context.data.node.objectFeatures.includes(EObjectFeature.dataSource)
            || !connection?.features.includes(EConnectionFeature.manageable);
        },
        title: 'ui_delete',
        onClick: async context => {
          const node = context.data.node;
          try {
            await this.connectionsManagerService.deleteConnection(
              NodeManagerUtils.connectionNodeIdToConnectionId(node.id)
            );
          } catch (exception) {
            this.notificationService.logException(exception, 'Failed to delete connection');
          }
        },
      }
    );
  }

  load(): void { }
}
