/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ConnectionInfoResource } from '@cloudbeaver/core-connections';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { ContextMenuService, IMenuPanel } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { isNavigatorViewSettingsEqual, CONNECTION_NAVIGATOR_VIEW_SETTINGS, NavigatorViewSettings } from '@cloudbeaver/core-root';

import type { NavNode } from '../shared/NodesManager/EntityTypes';
import { EObjectFeature } from '../shared/NodesManager/EObjectFeature';
import { NavNodeManagerService } from '../shared/NodesManager/NavNodeManagerService';
import { NodeManagerUtils } from '../shared/NodesManager/NodeManagerUtils';

@injectable()
export class NavigationTreeContextMenuService extends Bootstrap {
  static nodeContextType = 'NodeWithParent';
  private static nodeViewMenuItemToken = 'nodeView';
  private static menuToken = 'navTreeMenu';

  constructor(
    private contextMenuService: ContextMenuService,
    private navNodeManagerService: NavNodeManagerService,
    private notificationService: NotificationService,
    private connectionInfoResource: ConnectionInfoResource
  ) {
    super();
  }

  getMenuToken(): string {
    return NavigationTreeContextMenuService.menuToken;
  }

  getNodeViewMenuItemToken(): string {
    return NavigationTreeContextMenuService.nodeViewMenuItemToken;
  }

  constructMenuWithContext(node: NavNode): IMenuPanel {
    return this.contextMenuService.createContextMenu<NavNode>({
      menuId: this.getMenuToken(),
      contextId: node.id,
      contextType: NavigationTreeContextMenuService.nodeContextType,
      data: node,
    });
  }

  private getConnectionFromNodeId(nodeId: string) {
    return this.connectionInfoResource.get(NodeManagerUtils.connectionNodeIdToConnectionId(nodeId));
  }

  private isSimpleNavigatorView(nodeId: string) {
    const currentSettings = this.getConnectionFromNodeId(nodeId)?.navigatorSettings;

    if (!currentSettings) {
      return false;
    }

    return isNavigatorViewSettingsEqual(currentSettings, CONNECTION_NAVIGATOR_VIEW_SETTINGS.simple);
  }

  private async changeConnectionView(nodeId: string, settings: NavigatorViewSettings) {
    const connectionId = NodeManagerUtils.connectionNodeIdToConnectionId(nodeId);

    try {
      await this.connectionInfoResource.changeConnectionView(connectionId, settings);
      await this.navNodeManagerService.refreshTree(nodeId);
    } catch (exception) {
      this.notificationService.logException(exception);
    }
  }

  registerNodeViewMenuItem() {
    this.contextMenuService.addMenuItem<NavNode>(
      this.contextMenuService.getRootMenuToken(),
      {
        id: this.getNodeViewMenuItemToken(),
        isPresent(context) {
          return context.contextType === NavigationTreeContextMenuService.nodeContextType
            && context.data.objectFeatures.includes(EObjectFeature.dataSource);
        },
        isHidden: context => {
          const connection = this.getConnectionFromNodeId(context.data.id);
          return !connection?.connected;
        },
        order: 2,
        title: 'app_navigationTree_connection_view',
        isPanel: true,
      }
    );
    this.contextMenuService.addMenuItem<NavNode>(
      this.getNodeViewMenuItemToken(),
      {
        id: 'simple',
        title: 'app_navigationTree_connection_view_option_simple',
        type: 'radio',
        isChecked: context => this.isSimpleNavigatorView(context.data.id),
        isPresent(context) {
          return context.contextType === NavigationTreeContextMenuService.nodeContextType
            && context.data.objectFeatures.includes(EObjectFeature.dataSource);
        },
        onClick: async context =>
          await this.changeConnectionView(context.data.id, CONNECTION_NAVIGATOR_VIEW_SETTINGS.simple),

      }
    );
    this.contextMenuService.addMenuItem<NavNode>(
      this.getNodeViewMenuItemToken(),
      {
        id: 'advanced',
        title: 'app_navigationTree_connection_view_option_advanced',
        type: 'radio',
        isChecked: context => !this.isSimpleNavigatorView(context.data.id),
        separator: true,
        isPresent(context) {
          return context.contextType === NavigationTreeContextMenuService.nodeContextType
            && context.data.objectFeatures.includes(EObjectFeature.dataSource);
        },
        onClick: async context =>
          await this.changeConnectionView(context.data.id, CONNECTION_NAVIGATOR_VIEW_SETTINGS.advanced),
      }
    );

    this.contextMenuService.addMenuItem<NavNode>(
      this.getNodeViewMenuItemToken(),
      {
        id: 'systemObjects',
        title: 'app_navigationTree_connection_view_option_showSystemObjects',
        type: 'checkbox',
        isChecked: context => !!this.getConnectionFromNodeId(context.data.id)?.navigatorSettings.showSystemObjects,
        isPresent(context) {
          return context.contextType === NavigationTreeContextMenuService.nodeContextType
            && context.data.objectFeatures.includes(EObjectFeature.dataSource);
        },
        onClick: async context => {
          const currentSettings = this.getConnectionFromNodeId(context.data.id)?.navigatorSettings;
          if (!currentSettings) {
            return;
          }

          return await this.changeConnectionView(context.data.id, {
            ...currentSettings,
            showSystemObjects: !currentSettings.showSystemObjects,
          });
        },
      }
    );
  }

  register(): void {
    this.contextMenuService.addMenuItem<NavNode>(
      this.contextMenuService.getRootMenuToken(),
      {
        id: 'openNodeTab',
        isPresent(context) {
          return context.contextType === NavigationTreeContextMenuService.nodeContextType;
        },
        order: 1,
        title: 'app_navigationTree_openNodeTab',
        onClick: context => {
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
        onClick: async context => {
          const node = context.data;
          try {
            await this.navNodeManagerService.refreshTree(node.id);
          } catch (exception) {
            this.notificationService.logException(exception, 'Failed to refresh node');
          }
        },
      }
    );

    this.registerNodeViewMenuItem();
  }

  load(): void { }
}
