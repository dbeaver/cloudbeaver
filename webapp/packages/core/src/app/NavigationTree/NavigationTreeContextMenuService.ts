/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@dbeaver/core/di';
import {
  ContextMenuService, IContextMenuItem, IMenuContext, IMenuPanel,
} from '@dbeaver/core/dialogs';

import { NodesManagerService } from '../shared/NodesManager/NodesManagerService';
import { NodeWithParent } from '../shared/NodesManager/NodeWithParent';

@injectable()
export class NavigationTreeContextMenuService {
  static nodeContextType = 'NodeWithParent';
  private static menuToken = 'navTreeMenu';

  constructor(private contextMenuService: ContextMenuService,
              private nodesManagerService: NodesManagerService) {
  }

  getMenuToken() {
    return NavigationTreeContextMenuService.menuToken;
  }

  constructMenuWithContext(node: NodeWithParent): IMenuPanel {
    const context: IMenuContext<NodeWithParent> = {
      menuId: this.getMenuToken(),
      contextId: node.id,
      contextType: NavigationTreeContextMenuService.nodeContextType,
      data: node,
    };
    return this.contextMenuService.createContextMenu(context);
  }

  registerMenuItems() {
    const openNodeTab: IContextMenuItem<NodeWithParent> = {
      id: 'openNodeTab',
      isPresent(context) {
        return context.contextType === NavigationTreeContextMenuService.nodeContextType;
      },
      order: 1,
      title: 'app_navigationTree_openNodeTab',
      onClick: (context: IMenuContext<NodeWithParent>) => {
        const node = context.data;
        this.nodesManagerService.navToNode(node.id);
      },
    };
    this.contextMenuService.addMenuItem<NodeWithParent>(this.contextMenuService.getRootMenuToken(), openNodeTab);

    const refreshNode: IContextMenuItem<NodeWithParent> = {
      id: 'refreshNode',
      isPresent(context) {
        return context.contextType === NavigationTreeContextMenuService.nodeContextType;
      },
      order: 1000,
      title: 'app_navigationTree_refreshNode',
      onClick: (context: IMenuContext<NodeWithParent>) => {
        const node = context.data;
        this.nodesManagerService.refreshNode(node.id);
      },
    };
    this.contextMenuService.addMenuItem<NodeWithParent>(this.contextMenuService.getRootMenuToken(), refreshNode);
  }
}
