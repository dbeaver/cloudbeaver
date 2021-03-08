/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ConnectionInfoResource, CONNECTION_NAVIGATOR_VIEW_SETTINGS, getNavigatorView, isNavigatorSettingEnabled, NavigatorViewSettingsKeys } from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import { ContextMenuService, IMenuPanel } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import type { NavigatorSettingsInput } from '@cloudbeaver/core-sdk';

import type { NavNode } from '../shared/NodesManager/EntityTypes';
import { EObjectFeature } from '../shared/NodesManager/EObjectFeature';
import { NavNodeManagerService } from '../shared/NodesManager/NavNodeManagerService';
import { NodeManagerUtils } from '../shared/NodesManager/NodeManagerUtils';

@injectable()
export class NavigationTreeContextMenuService {
  static nodeContextType = 'NodeWithParent';
  private static nodeViewMenuItemToken = 'nodeView';
  private static menuToken = 'navTreeMenu';

  constructor(
    private contextMenuService: ContextMenuService,
    private navNodeManagerService: NavNodeManagerService,
    private notificationService: NotificationService,
    private connectionInfoResource: ConnectionInfoResource
  ) { }

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

  private getConnectionViewSettings(nodeId: string) {
    const connectionId = NodeManagerUtils.connectionNodeIdToConnectionId(nodeId);

    const connection = this.connectionInfoResource.get(connectionId);

    if (!connection) {
      return null;
    }

    return connection.navigatorSettings;
  }

  private getConnectionNavigatorView(nodeId: string) {
    const connectionViewSettings = this.getConnectionViewSettings(nodeId);

    if (!connectionViewSettings) {
      return null;
    }

    return getNavigatorView(connectionViewSettings);
  }

  private isConnectionViewSettingEnabled(nodeId: string, setting: NavigatorViewSettingsKeys) {
    const connectionViewSettings = this.getConnectionViewSettings(nodeId);

    if (!connectionViewSettings) {
      return false;
    }

    return isNavigatorSettingEnabled(setting, connectionViewSettings);
  }

  private async changeConnectionView(nodeId: string, settings: NavigatorSettingsInput) {
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
        isChecked: context => this.getConnectionNavigatorView(context.data.id) === 'simple',
        isPresent(context) {
          return context.contextType === NavigationTreeContextMenuService.nodeContextType
            && context.data.objectFeatures.includes(EObjectFeature.dataSource);
        },
        onClick: async context =>
          await this.changeConnectionView(context.data.id, {
            ...CONNECTION_NAVIGATOR_VIEW_SETTINGS.simple,
            showSystemObjects: this.isConnectionViewSettingEnabled(context.data.id, 'showSystemObjects'),
          }),
      }
    );
    this.contextMenuService.addMenuItem<NavNode>(
      this.getNodeViewMenuItemToken(),
      {
        id: 'advanced',
        title: 'app_navigationTree_connection_view_option_advanced',
        type: 'radio',
        isChecked: context => this.getConnectionNavigatorView(context.data.id) === 'advanced',
        isPresent(context) {
          return context.contextType === NavigationTreeContextMenuService.nodeContextType
            && context.data.objectFeatures.includes(EObjectFeature.dataSource);
        },
        onClick: async context =>
          await this.changeConnectionView(context.data.id, {
            ...CONNECTION_NAVIGATOR_VIEW_SETTINGS.advanced,
            showSystemObjects: this.isConnectionViewSettingEnabled(context.data.id, 'showSystemObjects'),
          }),
      }
    );
    this.contextMenuService.addMenuItem<NavNode>(
      this.getNodeViewMenuItemToken(),
      {
        id: 'systemObjects',
        title: 'app_navigationTree_connection_view_option_showSystemObjects',
        isChecked: context => this.isConnectionViewSettingEnabled(context.data.id, 'showSystemObjects'),
        isPresent(context) {
          return context.contextType === NavigationTreeContextMenuService.nodeContextType
            && context.data.objectFeatures.includes(EObjectFeature.dataSource);
        },
        onClick: async context => {
          const currentSettings = this.getConnectionViewSettings(context.data.id);
          if (!currentSettings) {
            return;
          }
          return await this.changeConnectionView(context.data.id, {
            ...currentSettings,
            showSystemObjects: !currentSettings['showSystemObjects'],
          });
        },
      }
    );
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
        onClick: context => {
          const node = context.data;
          this.navNodeManagerService.refreshTree(node.id);
        },
      }
    );

    this.registerNodeViewMenuItem();
  }
}
