/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ConnectionInfoResource } from '@cloudbeaver/core-connections';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { CommonDialogService, ComputedContextMenuModel, ConfirmationDialog, ContextMenuService, DialogueStateResult, IContextMenuItem, IMenuPanel, RenameDialog } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { isNavigatorViewSettingsEqual, CONNECTION_NAVIGATOR_VIEW_SETTINGS, NavigatorViewSettings } from '@cloudbeaver/core-root';
import type { SqlQueryGenerator } from '@cloudbeaver/core-sdk';

import { GeneratedSqlDialog } from '../SqlGenerators/GeneratedSqlDialog';
import { MAX_GENERATORS_LENGTH, SqlGeneratorsResource } from '../SqlGenerators/SqlGeneratorsResource';
import { ENodeFeature } from './ENodeFeature';
import type { NavNode } from './EntityTypes';
import { EObjectFeature } from './EObjectFeature';
import type { INodeActions } from './INodeActions';
import { getNodeName } from './NavNodeInfoResource';
import { NavNodeManagerService } from './NavNodeManagerService';
import { NavTreeResource } from './NavTreeResource';
import { NodeManagerUtils } from './NodeManagerUtils';

export interface INodeMenuData {
  node: NavNode;
  actions?: INodeActions;
}

@injectable()
export class NavNodeContextMenuService extends Bootstrap {
  static nodeContextType = 'NodeWithParent';
  private static nodeViewMenuItemToken = 'nodeView';
  private static sqlGeneratorsToken = 'sqlGenerators';
  private static menuToken = 'navTreeMenu';

  constructor(
    private readonly contextMenuService: ContextMenuService,
    private readonly navNodeManagerService: NavNodeManagerService,
    private readonly notificationService: NotificationService,
    private readonly commonDialogService: CommonDialogService,
    private readonly connectionInfoResource: ConnectionInfoResource,
    private readonly navTreeResource: NavTreeResource,
    private readonly sqlGeneratorsResource: SqlGeneratorsResource
  ) {
    super();
  }

  getMenuToken(): string {
    return NavNodeContextMenuService.menuToken;
  }

  getNodeViewMenuItemToken(): string {
    return NavNodeContextMenuService.nodeViewMenuItemToken;
  }

  getSqlGeneratorsToken(): string {
    return NavNodeContextMenuService.sqlGeneratorsToken;
  }

  constructMenuWithContext(node: NavNode, actions?: INodeActions): IMenuPanel {
    return this.contextMenuService.createContextMenu<INodeMenuData>({
      menuId: this.getMenuToken(),
      contextId: node.id,
      contextType: NavNodeContextMenuService.nodeContextType,
      data: {
        node,
        actions,
      },
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

  private registerNodeViewMenuItem(): void {
    this.contextMenuService.addMenuItem<INodeMenuData>(
      this.contextMenuService.getRootMenuToken(),
      {
        id: this.getNodeViewMenuItemToken(),
        order: 2,
        title: 'app_navigationTree_connection_view',
        isPanel: true,
        isPresent(context) {
          return context.contextType === NavNodeContextMenuService.nodeContextType
            && context.data.node.objectFeatures.includes(EObjectFeature.dataSource);
        },
        isHidden: context => {
          const connection = this.getConnectionFromNodeId(context.data.node.id);
          return !connection?.connected;
        },
      }
    );
    this.contextMenuService.addMenuItem<INodeMenuData>(
      this.getNodeViewMenuItemToken(),
      {
        id: 'simple',
        title: 'app_navigationTree_connection_view_option_simple',
        type: 'radio',
        isChecked: context => this.isSimpleNavigatorView(context.data.node.id),
        isPresent(context) {
          return context.contextType === NavNodeContextMenuService.nodeContextType
            && context.data.node.objectFeatures.includes(EObjectFeature.dataSource);
        },
        onClick: async context =>
          await this.changeConnectionView(context.data.node.id, CONNECTION_NAVIGATOR_VIEW_SETTINGS.simple),

      }
    );
    this.contextMenuService.addMenuItem<INodeMenuData>(
      this.getNodeViewMenuItemToken(),
      {
        id: 'advanced',
        title: 'app_navigationTree_connection_view_option_advanced',
        type: 'radio',
        separator: true,
        isChecked: context => !this.isSimpleNavigatorView(context.data.node.id),
        isPresent(context) {
          return context.contextType === NavNodeContextMenuService.nodeContextType
            && context.data.node.objectFeatures.includes(EObjectFeature.dataSource);
        },
        onClick: async context =>
          await this.changeConnectionView(context.data.node.id, CONNECTION_NAVIGATOR_VIEW_SETTINGS.advanced),
      }
    );

    this.contextMenuService.addMenuItem<INodeMenuData>(
      this.getNodeViewMenuItemToken(),
      {
        id: 'systemObjects',
        title: 'app_navigationTree_connection_view_option_showSystemObjects',
        type: 'checkbox',
        isChecked: context => !!this.getConnectionFromNodeId(context.data.node.id)?.navigatorSettings.showSystemObjects,
        isPresent(context) {
          return context.contextType === NavNodeContextMenuService.nodeContextType
            && context.data.node.objectFeatures.includes(EObjectFeature.dataSource);
        },
        onClick: async context => {
          const currentSettings = this.getConnectionFromNodeId(context.data.node.id)?.navigatorSettings;
          if (!currentSettings) {
            return;
          }

          return await this.changeConnectionView(context.data.node.id, {
            ...currentSettings,
            showSystemObjects: !currentSettings.showSystemObjects,
          });
        },
      }
    );
  }

  private getSqlGeneratorsItems(
    generatorsGetter: () => SqlQueryGenerator[]
  ): Array<IContextMenuItem<INodeMenuData>> {
    return Array.from(Array(MAX_GENERATORS_LENGTH).keys()).map(index => {
      const id = String(index) + 'Generator';
      return {
        id,
        isPresent: () => true,
        isHidden: () => {
          const generators = generatorsGetter();
          return index >= generators.length;
        },
        titleGetter: () => {
          const generators = generatorsGetter();

          if (index >= generators.length) {
            return '';
          }

          return generators[index].label;
        },
        onClick: context => {
          const generators = generatorsGetter();

          if (index < generators.length) {
            this.commonDialogService.open(GeneratedSqlDialog, {
              generatorId: generators[index].id,
              pathId: context.data.node.id,
            });
          }
        },
      };
    });
  }

  private registerSqlGenerators() {
    this.contextMenuService.addMenuItem<INodeMenuData>(
      this.contextMenuService.getRootMenuToken(),
      {
        id: this.getSqlGeneratorsToken(),
        order: 3,
        title: 'app_shared_sql_generators_panel_title',
        isPresent(context) {
          return context.contextType === NavNodeContextMenuService.nodeContextType
            && (
              context.data.node.objectFeatures.includes(EObjectFeature.entity)
              || context.data.node.objectFeatures.includes(EObjectFeature.entityContainer)
            );
        },
        isProcessing: context => this.sqlGeneratorsResource.isDataLoading(context.data.node.id),
        isPanelAvailable: context => this.sqlGeneratorsResource.isLoaded(context.data.node.id),
        isDisabled: context => this.sqlGeneratorsResource.get(context.data.node.id)?.length === 0,
        onClick: context => this.sqlGeneratorsResource.load(context.data.node.id),
        onMouseEnter: context => this.sqlGeneratorsResource.load(context.data.node.id),
        panel: new ComputedContextMenuModel<INodeMenuData>({
          id: 'generatorsPanel',
          menuItemsGetter: context => this.getSqlGeneratorsItems(
            () => this.sqlGeneratorsResource.get(context.data.node.id) || []
          ),
        }),
      }
    );
  }

  register(): void {
    this.contextMenuService.addMenuItem<INodeMenuData>(
      this.contextMenuService.getRootMenuToken(),
      {
        id: 'openNodeTab',
        order: 1,
        title: 'app_navigationTree_openNodeTab',
        isPresent(context) {
          return context.contextType === NavNodeContextMenuService.nodeContextType;
        },
        onClick: context => {
          const node = context.data.node;
          this.navNodeManagerService.navToNode(node.id, node.parentId);
        },
      }
    );

    this.contextMenuService.addMenuItem<INodeMenuData>(
      this.contextMenuService.getRootMenuToken(),
      {
        id: 'refreshNode',
        order: Number.MAX_SAFE_INTEGER,
        title: 'app_navigationTree_refreshNode',
        isPresent(context) {
          return context.contextType === NavNodeContextMenuService.nodeContextType;
        },
        onClick: async context => {
          const node = context.data.node;
          try {
            await this.navNodeManagerService.refreshTree(node.id);
          } catch (exception) {
            this.notificationService.logException(exception, 'Failed to refresh node');
          }
        },
      }
    );

    this.contextMenuService.addMenuItem<INodeMenuData>(
      this.contextMenuService.getRootMenuToken(),
      {
        id: 'rename',
        icon: 'edit',
        title: 'ui_rename',
        isPresent: context => context.contextType === NavNodeContextMenuService.nodeContextType,
        isHidden: context => !context.data.node.features?.includes(ENodeFeature.canRename),
        onClick: async context => {
          const node = context.data.node;

          if (context.data.actions?.rename) {
            context.data.actions.rename();
          } else {
            const name = node.name || '';
            const result = await this.commonDialogService.open(RenameDialog, {
              value: name,
              subTitle: name,
              objectName: node.nodeType || 'Object',
              icon: node.icon,
            });

            if (result !== DialogueStateResult.Rejected && result !== DialogueStateResult.Resolved) {
              if (name !== result && result.trim().length) {
                try {
                  await this.navTreeResource.changeName(node, result);
                } catch (exception) {
                  this.notificationService.logException(exception, 'Error occurred while renaming');
                }
              }
            }
          }
        },
      }
    );

    this.contextMenuService.addMenuItem<INodeMenuData>(
      this.contextMenuService.getRootMenuToken(),
      {
        id: 'deleteNode',
        title: 'ui_delete',
        isPresent: context => context.contextType === NavNodeContextMenuService.nodeContextType,
        isHidden: context => !context.data.node.features?.includes(ENodeFeature.canDelete)
          || context.data.node.objectFeatures.includes(EObjectFeature.dataSource),
        onClick: async context => {
          const node = context.data.node;
          const nodeName = getNodeName(node);

          const result = await this.commonDialogService.open(ConfirmationDialog, {
            title: 'ui_data_delete_confirmation',
            subTitle: node.name,
            message: `You're going to delete "${nodeName}". Are you sure?`,
            confirmActionText: 'ui_delete',
            icon: node.icon,
          });

          if (result === DialogueStateResult.Rejected) {
            return;
          }

          try {
            await this.navTreeResource.deleteNode(node.id);
          } catch (exception) {
            this.notificationService.logException(exception, `Failed to delete "${nodeName}"`);
          }
        },
      }
    );

    this.registerNodeViewMenuItem();
    this.registerSqlGenerators();
  }

  load(): void { }
}
