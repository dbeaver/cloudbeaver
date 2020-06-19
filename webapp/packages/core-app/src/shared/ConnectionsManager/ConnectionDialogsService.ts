/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import {
  ContextMenuService,
  IContextMenuItem,
  IMenuContext,
} from '@cloudbeaver/core-dialogs';

import { NavigationTreeContextMenuService } from '../../NavigationTree/NavigationTreeContextMenuService';
import { EMainMenu, MainMenuService } from '../../TopNavBar/MainMenu/MainMenuService';
import { NavNode } from '../NodesManager/EntityTypes';
import { EObjectFeature } from '../NodesManager/EObjectFeature';
import { ConnectionsManagerService } from './ConnectionsManagerService';

@injectable()
export class ConnectionDialogsService {
  newConnectionMenuToken = 'connectionMenu';

  constructor(private mainMenuService: MainMenuService,
              private contextMenuService: ContextMenuService,
              private connectionsManagerService: ConnectionsManagerService) {
  }

  registerMenuItems() {
    this.mainMenuService.registerMenuItem(
      EMainMenu.mainMenuConnectionsPanel,
      {
        id: this.newConnectionMenuToken,
        order: 1,
        title: 'app_shared_connectionMenu_newConnection',
        isPanel: true,
        isHidden: () => this.mainMenuService.isEmptyMenuPanel(this.newConnectionMenuToken),
      }
    );

    this.mainMenuService.registerMenuItem(
      EMainMenu.mainMenuConnectionsPanel,
      {
        id: 'mainMenuDisconnect',
        order: 2,
        title: 'app_shared_connectionMenu_disconnect',
        onClick: () => this.connectionsManagerService.closeAllConnections(),
      }
    );

    const closeConnection: IContextMenuItem<NavNode> = {
      id: 'closeConnection',
      isPresent(context) {
        return context.contextType === NavigationTreeContextMenuService.nodeContextType
        && !!context.data.objectFeatures.includes(EObjectFeature.dataSource);
      },
      title: 'Disconnect',
      onClick: (context: IMenuContext<NavNode>) => {
        const node = context.data;
        this.connectionsManagerService.closeNavNodeConnectionAsync(node.id);
      },
    };

    this.contextMenuService.addMenuItem<NavNode>(this.contextMenuService.getRootMenuToken(), closeConnection);
  }
}
