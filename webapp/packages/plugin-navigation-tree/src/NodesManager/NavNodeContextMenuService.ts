/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { RenameDialog } from '@cloudbeaver/core-blocks';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import type { IDataContextProvider } from '@cloudbeaver/core-data-context';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import {
  DATA_CONTEXT_NAV_NODE,
  ENodeFeature,
  EObjectFeature,
  getNodePlainName,
  type INodeActions,
  isConnectionFolder,
  type NavNode,
  NavNodeInfoResource,
  NavNodeManagerService,
  NavTreeResource,
  NavTreeSettingsService,
  NodeManagerUtils,
} from '@cloudbeaver/core-navigation-tree';
import { ConnectionInfoResource, DATA_CONTEXT_CONNECTION, EConnectionFeature, isConnectionNode } from '@cloudbeaver/core-connections';
import {
  ACTION_DELETE,
  ACTION_OPEN,
  ACTION_REFRESH,
  ACTION_RENAME,
  ActionService,
  menuExtractItems,
  MenuSeparatorItem,
  MenuService,
} from '@cloudbeaver/core-view';

import { DATA_CONTEXT_NAV_NODE_ACTIONS } from '../NavigationTree/ElementsTree/NavigationTreeNode/TreeNodeMenu/DATA_CONTEXT_NAV_NODE_ACTIONS.js';
import { MENU_NAVIGATION_TREE_CREATE } from '../NavigationTree/ElementsTree/NavigationTreeNode/TreeNodeMenu/MENU_NAVIGATION_TREE_CREATE.js';
import { MENU_NAVIGATION_TREE_MANAGE } from '../NavigationTree/ElementsTree/NavigationTreeNode/TreeNodeMenu/MENU_NAVIGATION_TREE_MANAGE.js';
import { MENU_NAVIGATION_TREE_TOOLS } from '../NavigationTree/ElementsTree/NavigationTreeNode/TreeNodeMenu/MENU_NAVIGATION_TREE_TOOLS.js';
import { NodeDeletionService } from './NodeDeletion/NodeDeletionService.js';
import { DATA_CONTEXT_ELEMENTS_TREE } from '../NavigationTree/ElementsTree/DATA_CONTEXT_ELEMENTS_TREE.js';

export interface INodeMenuData {
  node: NavNode;
  actions?: INodeActions;
}

@injectable(() => [
  NavNodeManagerService,
  NotificationService,
  CommonDialogService,
  NavTreeResource,
  ActionService,
  MenuService,
  NavNodeInfoResource,
  NavTreeSettingsService,
  ConnectionInfoResource,
  NodeDeletionService,
])
export class NavNodeContextMenuService extends Bootstrap {
  constructor(
    private readonly navNodeManagerService: NavNodeManagerService,
    private readonly notificationService: NotificationService,
    private readonly commonDialogService: CommonDialogService,
    private readonly navTreeResource: NavTreeResource,
    private readonly actionService: ActionService,
    private readonly menuService: MenuService,
    private readonly navNodeInfoResource: NavNodeInfoResource,
    private readonly navTreeSettingsService: NavTreeSettingsService,
    private readonly connectionInfoResource: ConnectionInfoResource,
    private readonly nodeDeletionService: NodeDeletionService,
  ) {
    super();
  }

  private getDeletionNodes(context: IDataContextProvider): NavNode[] {
    const node = context.get(DATA_CONTEXT_NAV_NODE)!;
    const tree = context.get(DATA_CONTEXT_ELEMENTS_TREE);
    if (!tree?.isNodeSelected(node.uri)) {
      return [node];
    }
    return tree
      .getSelected()
      .map(id => this.navNodeInfoResource.get(id))
      .filter((node): node is NavNode => !!node);
  }

  override register(): void {
    this.actionService.addHandler({
      id: 'nav-node-selection-delete',
      menus: [MENU_NAVIGATION_TREE_MANAGE],
      actions: [ACTION_DELETE],
      contexts: [DATA_CONTEXT_NAV_NODE],
      isHidden: (context, action) => {
        if (action === ACTION_DELETE) {
          return !this.nodeDeletionService.canDelete(this.getDeletionNodes(context));
        }

        return true;
      },
      isDisabled: (context, action) => {
        if (action === ACTION_DELETE) {
          return this.nodeDeletionService.isDeleting || !this.nodeDeletionService.canDelete(this.getDeletionNodes(context));
        }

        return true;
      },
      handler: async (context, action) => {
        if (action === ACTION_DELETE) {
          await this.nodeDeletionService.delete(this.getDeletionNodes(context));
        }
      },
    });

    this.actionService.addHandler({
      id: 'nav-node-base-manage-menu',
      menus: [MENU_NAVIGATION_TREE_MANAGE],
      actions: [ACTION_RENAME],
      contexts: [DATA_CONTEXT_NAV_NODE],
      isActionApplicable: (context, action) => {
        const node = context.get(DATA_CONTEXT_NAV_NODE)!;
        const connectionKey = context.get(DATA_CONTEXT_CONNECTION);

        const connection = connectionKey ? this.connectionInfoResource.get(connectionKey) : null;

        if (connection?.features.includes(EConnectionFeature.restrictMetadataEdit)) {
          return false;
        }

        if (NodeManagerUtils.isDatabaseObject(node.uri) || isConnectionFolder(node)) {
          if (action === ACTION_RENAME) {
            return node.features?.includes(ENodeFeature.canRename) ?? false;
          }
        }

        return false;
      },
      handler: async (context, action) => {
        const node = context.get(DATA_CONTEXT_NAV_NODE)!;
        const name = getNodePlainName(node);

        switch (action) {
          case ACTION_RENAME: {
            const actions = context.get(DATA_CONTEXT_NAV_NODE_ACTIONS);

            const save = async (newName: string) => {
              if (name !== newName && newName.trim().length) {
                try {
                  await this.navTreeResource.changeName(node, newName);
                } catch (exception: any) {
                  this.notificationService.logException(exception, 'app_navigationTree_node_rename_error');
                  return false;
                }
              }
              return true;
            };

            if (actions?.rename) {
              actions.rename(save);
            } else {
              const { status, result } = await this.commonDialogService.open(RenameDialog, {
                name,
                subTitle: name,
                objectName: node.nodeType || 'Object',
                icon: node.icon,
                validation: name => name.trim().length > 0,
              });

              if (status === DialogueStateResult.Resolved && result !== undefined) {
                save(result);
              }
            }
            break;
          }
        }
      },
    });

    this.actionService.addHandler({
      id: 'nav-node-base-handler',
      contexts: [DATA_CONTEXT_NAV_NODE],
      isActionApplicable: (context, action): boolean => {
        const node = context.get(DATA_CONTEXT_NAV_NODE)!;

        if (action === ACTION_OPEN) {
          return this.navNodeManagerService.canOpen(node.uri, node.parentId);
        }

        return [ACTION_REFRESH].includes(action);
      },
      handler: async (context, action) => {
        const node = context.get(DATA_CONTEXT_NAV_NODE)!;

        switch (action) {
          case ACTION_OPEN: {
            this.navNodeManagerService.navToNode(node.uri, node.parentId);
            break;
          }
          case ACTION_REFRESH: {
            try {
              if (isConnectionNode(node) && !node.objectFeatures.includes(EObjectFeature.dataSourceConnected)) {
                await this.navNodeInfoResource.refresh(node.uri);
              } else {
                await this.navNodeManagerService.refreshTree(node.uri);
              }
            } catch (exception: any) {
              this.notificationService.logException(exception, 'app_navigationTree_refresh_error');
            }
            break;
          }
        }
      },
    });

    this.menuService.setHandler({
      id: 'menu-navigation-tree-create',
      menus: [MENU_NAVIGATION_TREE_CREATE],
    });

    this.menuService.setHandler({
      id: 'menu-navigation-tree-manage',
      menus: [MENU_NAVIGATION_TREE_MANAGE],
    });

    this.menuService.setHandler({
      id: 'menu-navigation-tree-tools',
      menus: [MENU_NAVIGATION_TREE_TOOLS],
    });

    this.menuService.addCreator({
      menus: [MENU_NAVIGATION_TREE_MANAGE],
      contexts: [DATA_CONTEXT_NAV_NODE],
      getItems: (context, items) => {
        if (this.navTreeSettingsService.editing) {
          items.push(ACTION_RENAME);
        }

        if (this.navTreeSettingsService.deleting) {
          items.push(ACTION_DELETE);
        }

        return items;
      },
    });

    this.menuService.addCreator({
      root: true,
      contexts: [DATA_CONTEXT_NAV_NODE],
      getItems: (context, items) => [
        ...items,
        MENU_NAVIGATION_TREE_CREATE,
        ACTION_OPEN,
        ACTION_REFRESH,
        MENU_NAVIGATION_TREE_MANAGE,
        MENU_NAVIGATION_TREE_TOOLS,
      ],
      orderItems: (context, items) => {
        const actionsOpen = menuExtractItems(items, [ACTION_OPEN]);
        const actionsRefresh = menuExtractItems(items, [ACTION_REFRESH]);

        items.unshift(...actionsOpen);

        if (actionsRefresh.length > 0) {
          if (items.length > 0) {
            items.push(new MenuSeparatorItem());
          }
          items.push(...actionsRefresh);
        }

        return items;
      },
    });
  }
}
