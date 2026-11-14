/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { ConnectionInfoResource, createConnectionParam } from '@cloudbeaver/core-connections';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { NavNodeInfoResource } from '@cloudbeaver/core-navigation-tree';
import { NavigationTreeService } from '@cloudbeaver/plugin-navigation-tree';

import { type DBAdminManager, NAV_NODE_ADMIN_FOLDER_ID } from './DBAdminManager.js';
import { type DBAdminInfo, DBAdminService } from './DBAdminService.js';
import { DBAdminTabService } from './DBAdminTabs/DBAdminTabService.js';
import { createDBAdminTreeItemId, parseDBAdminTreeItemId } from './NavigationTree/DBAdminTreeItemId.js';

const DBAdminTreeItem = importLazyComponent(() => import('./NavigationTree/DBAdminTreeItem.js').then(m => m.DBAdminTreeItem));

@injectable(() => [NavNodeInfoResource, ConnectionInfoResource, DBAdminService, DBAdminTabService, NavigationTreeService])
export class DBAdminBootstrap extends Bootstrap {
  constructor(
    private readonly navNodeInfoResource: NavNodeInfoResource,
    private readonly connectionInfoResource: ConnectionInfoResource,
    private readonly dbAdminService: DBAdminService,
    private readonly dbAdminTabService: DBAdminTabService,
    private readonly navigationTreeService: NavigationTreeService,
  ) {
    super();
  }

  override register(): void {
    this.dbAdminTabService.register();
    this.registerNavigationTreeItems();
  }

  /** Shows the managers as children of the "Administer" folder in the navigation tree, as DBeaver does */
  private registerNavigationTreeItems(): void {
    this.navigationTreeService.addVirtualChildren({
      getChildren: node => {
        if (!this.isAdminFolder(node.uri)) {
          return [];
        }

        return this.getSupportedManagers(node.uri).map(manager => createDBAdminTreeItemId({ adminNodeId: node.uri, manager }));
      },
      renderer: {
        matches: nodeId => parseDBAdminTreeItemId(nodeId) !== null,
        Component: DBAdminTreeItem,
      },
    });
  }

  /** Returns managers supported by the connection of the node; none if it is not connected or still unknown */
  private getSupportedManagers(nodeId: string): DBAdminManager[] {
    const connection = this.connectionInfoResource.getConnectionForNode(nodeId);

    if (!connection?.connected) {
      return [];
    }

    const info: DBAdminInfo | null | undefined = this.dbAdminService.getInfo(createConnectionParam(connection));
    const managers: DBAdminManager[] = [];

    if (info?.sessionsSupported) {
      managers.push('sessions');
    }

    if (info?.locksSupported) {
      managers.push('locks');
    }

    return managers;
  }

  private isAdminFolder(nodeId: string): boolean {
    if (!nodeId.endsWith(`/${NAV_NODE_ADMIN_FOLDER_ID}`)) {
      return false;
    }

    return this.navNodeInfoResource.get(nodeId)?.folder === true;
  }
}
