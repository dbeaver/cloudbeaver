/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { ContextMenuService, IMenuPanel } from '@cloudbeaver/core-dialogs';

import { NavNode } from '../shared/NodesManager/EntityTypes';
import { NavNodeManagerService } from '../shared/NodesManager/NavNodeManagerService';

@injectable()
export class NavigationTreeContextMenuService {
  static nodeContextType = 'NodeWithParent';
  private static menuToken = 'navTreeMenu';

  constructor(
    private contextMenuService: ContextMenuService,
    private navNodeManagerService: NavNodeManagerService
  ) { }

  getMenuToken() {
    return NavigationTreeContextMenuService.menuToken;
  }

  constructMenuWithContext(node: NavNode): IMenuPanel {
    return this.contextMenuService.createContextMenu<NavNode>({
      menuId: this.getMenuToken(),
      contextId: node.id,
      contextType: NavigationTreeContextMenuService.nodeContextType,
      data: node,
    });
  }

  registerMenuItems() {
    this.contextMenuService.addMenuItem<NavNode>(
      this.contextMenuService.getRootMenuToken(),
      {
        id: 'openNodeTab',
        isPresent(context) {
          return context.contextType === NavigationTreeContextMenuService.nodeContextType;
        },
        order: 1,
        title: 'app_navigationTree_openNodeTab',
        onClick: (context) => {
          const node = context.data;
          this.navNodeManagerService.navToNode(node.id, node.parentId);
        },
      }
    );

    this.contextMenuService.addMenuItem<NavNode>(
      this.contextMenuService.getRootMenuToken(),
      {
        id: 'refreshNode',
        isPresent(context) {
          return context.contextType === NavigationTreeContextMenuService.nodeContextType;
        },
        order: Number.MAX_SAFE_INTEGER,
        title: 'app_navigationTree_refreshNode',
        onClick: (context) => {
          const node = context.data;
          this.navNodeManagerService.refreshTree(node.id);
        },
      }
    );
  }
}
