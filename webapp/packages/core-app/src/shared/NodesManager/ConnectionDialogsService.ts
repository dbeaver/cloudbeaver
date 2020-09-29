/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ConnectionInfoResource, ConnectionsManagerService, EConnectionFeature } from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import { ContextMenuService, IMenuContext } from '@cloudbeaver/core-dialogs';

import { NavigationTreeContextMenuService } from '../../NavigationTree/NavigationTreeContextMenuService';
import { EMainMenu, MainMenuService } from '../../TopNavBar/MainMenu/MainMenuService';
import { NavNode } from './EntityTypes';
import { EObjectFeature } from './EObjectFeature';
import { NodeManagerUtils } from './NodeManagerUtils';

@injectable()
export class ConnectionDialogsService {

  constructor(
    private mainMenuService: MainMenuService,
    private contextMenuService: ContextMenuService,
    private connectionsManagerService: ConnectionsManagerService,
    private connectionInfoResource: ConnectionInfoResource
  ) {}

  registerMenuItems() {

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

    this.contextMenuService.addMenuItem<NavNode>(
      this.contextMenuService.getRootMenuToken(),
      {
        id: 'closeConnection',
        isPresent:
          (context: IMenuContext<NavNode>) => context.contextType === NavigationTreeContextMenuService.nodeContextType,
        isHidden: (context: IMenuContext<NavNode>) => {
          const connectionId = NodeManagerUtils.connectionNodeIdToConnectionId(context.data.id);
          const connection = this.connectionInfoResource.get(connectionId);

          return !context.data.objectFeatures.includes(EObjectFeature.dataSource)
            || !connection?.connected;
        },
        title: 'app_shared_connectionMenu_disconnect',
        onClick: (context: IMenuContext<NavNode>) => {
          const node = context.data;
          this.connectionsManagerService.closeConnectionAsync(
            NodeManagerUtils.connectionNodeIdToConnectionId(node.id)
          );
        },
      }
    );

    this.contextMenuService.addMenuItem<NavNode>(
      this.contextMenuService.getRootMenuToken(),
      {
        id: 'deleteConnection',
        isPresent:
          (context: IMenuContext<NavNode>) => context.contextType === NavigationTreeContextMenuService.nodeContextType,
        isHidden: (context: IMenuContext<NavNode>) => {
          const connectionId = NodeManagerUtils.connectionNodeIdToConnectionId(context.data.id);
          const connection = this.connectionInfoResource.get(connectionId);

          return !context.data.objectFeatures.includes(EObjectFeature.dataSource)
            || !connection?.features.includes(EConnectionFeature.temporary);
        },
        title: 'ui_delete',
        onClick: (context: IMenuContext<NavNode>) => {
          const node = context.data;
          this.connectionsManagerService.deleteConnection(
            NodeManagerUtils.connectionNodeIdToConnectionId(node.id)
          );
        },
      }
    );
  }
}
