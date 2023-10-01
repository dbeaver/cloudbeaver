/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { CoreSettingsService } from '@cloudbeaver/core-app';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { CommonDialogService, ConfirmationDialogDelete, DialogueStateResult, RenameDialog } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { ExecutorInterrupter } from '@cloudbeaver/core-executor';
import { LocalizationService } from '@cloudbeaver/core-localization';
import {
  DATA_CONTEXT_NAV_NODE,
  ENodeFeature,
  getNodePlainName,
  type INodeActions,
  NAV_NODE_TYPE_FOLDER,
  type NavNode,
  NavNodeInfoResource,
  NavNodeManagerService,
  NavTreeResource,
  NavTreeSettingsService,
  nodeDeleteContext,
  NodeManagerUtils,
} from '@cloudbeaver/core-navigation-tree';
import { ResourceKeyUtils } from '@cloudbeaver/core-resource';
import {
  ACTION_DELETE,
  ACTION_OPEN,
  ACTION_REFRESH,
  ACTION_RENAME,
  ActionService,
  DATA_CONTEXT_MENU_NESTED,
  menuExtractItems,
  MenuSeparatorItem,
  MenuService,
} from '@cloudbeaver/core-view';

import { DATA_CONTEXT_NAV_NODE_ACTIONS } from '../NavigationTree/ElementsTree/NavigationTreeNode/TreeNodeMenu/DATA_CONTEXT_NAV_NODE_ACTIONS';

export interface INodeMenuData {
  node: NavNode;
  actions?: INodeActions;
}

@injectable()
export class NavNodeContextMenuService extends Bootstrap {
  constructor(
    private readonly navNodeManagerService: NavNodeManagerService,
    private readonly notificationService: NotificationService,
    private readonly commonDialogService: CommonDialogService,
    private readonly navTreeResource: NavTreeResource,
    private readonly actionService: ActionService,
    private readonly menuService: MenuService,
    private readonly coreSettingsService: CoreSettingsService,
    private readonly localizationService: LocalizationService,
    private readonly navNodeInfoResource: NavNodeInfoResource,
    private readonly navTreeSettingsService: NavTreeSettingsService,
  ) {
    super();
  }

  register(): void {
    this.navTreeResource.beforeNodeDelete.addPostHandler(async (data, contexts) => {
      if (ExecutorInterrupter.isInterrupted(contexts)) {
        return;
      }

      const deleteContext = contexts.getContext(nodeDeleteContext);

      if (deleteContext.confirmed) {
        return;
      }

      const nodes = ResourceKeyUtils.mapArray(data, nodeId => this.navNodeInfoResource.get(nodeId)).filter<NavNode>(Boolean as any);

      const name = nodes.map(node => node.name).join(', ');
      const folder = nodes.some(node => node.folder);

      let message: string = this.localizationService.translate('app_navigationTree_node_delete_confirmation', undefined, { name });

      if (folder) {
        message = message + '\n' + this.localizationService.translate('app_navigationTree_node_folder_delete_confirmation');
      }

      const result = await this.commonDialogService.open(ConfirmationDialogDelete, {
        title: 'ui_data_delete_confirmation',
        message,
        confirmActionText: 'ui_delete',
      });

      if (result === DialogueStateResult.Rejected) {
        ExecutorInterrupter.interrupt(contexts);
      }
    });

    this.actionService.addHandler({
      id: 'nav-node-base-handler',
      isActionApplicable: (context, action): boolean => {
        const node = context.tryGet(DATA_CONTEXT_NAV_NODE);

        if (!node) {
          return false;
        }

        if (NodeManagerUtils.isDatabaseObject(node.id) || node.nodeType === NAV_NODE_TYPE_FOLDER) {
          if (action === ACTION_RENAME) {
            return node.features?.includes(ENodeFeature.canRename) ?? false;
          }

          if (action === ACTION_DELETE) {
            return node.features?.includes(ENodeFeature.canDelete) ?? false;
          }
        }

        if (action === ACTION_OPEN) {
          return this.navNodeManagerService.canOpen(node.id, node.parentId);
        }

        return [ACTION_OPEN, ACTION_REFRESH].includes(action);
      },
      handler: async (context, action) => {
        const node = context.get(DATA_CONTEXT_NAV_NODE);
        const name = getNodePlainName(node);

        switch (action) {
          case ACTION_OPEN: {
            this.navNodeManagerService.navToNode(node.id, node.parentId);
            break;
          }
          case ACTION_REFRESH: {
            try {
              await this.navNodeManagerService.refreshTree(node.id);
            } catch (exception: any) {
              this.notificationService.logException(exception, 'app_navigationTree_refresh_error');
            }
            break;
          }
          case ACTION_RENAME: {
            const actions = context.tryGet(DATA_CONTEXT_NAV_NODE_ACTIONS);

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
              const result = await this.commonDialogService.open(RenameDialog, {
                value: name,
                subTitle: name,
                objectName: node.nodeType || 'Object',
                icon: node.icon,
                validation: name => name.trim().length > 0,
              });

              if (result !== DialogueStateResult.Rejected && result !== DialogueStateResult.Resolved) {
                save(result);
              }
            }
            break;
          }
          case ACTION_DELETE: {
            try {
              await this.navTreeResource.deleteNode(node.id);
            } catch (exception: any) {
              this.notificationService.logException(
                exception,
                this.localizationService.translate('app_navigationTree_node_delete_error', undefined, { name }),
              );
            }
            break;
          }
        }
      },
    });

    this.menuService.addCreator({
      isApplicable: context => context.has(DATA_CONTEXT_NAV_NODE) && !context.has(DATA_CONTEXT_MENU_NESTED),
      getItems: (context, items) => {
        const editingGlobalPermission = this.navTreeSettingsService.settings.isValueDefault('editing')
          ? this.coreSettingsService.settings.getValue('app.metadata.editing')
          : this.navTreeSettingsService.settings.getValue('editing');

        const deleteGlobalPermission = this.navTreeSettingsService.settings.isValueDefault('deleting')
          ? this.coreSettingsService.settings.getValue('app.metadata.deleting')
          : this.navTreeSettingsService.settings.getValue('deleting');

        items = [ACTION_OPEN, ACTION_REFRESH, ...items];

        if (editingGlobalPermission) {
          items.push(ACTION_RENAME);
        }

        if (deleteGlobalPermission) {
          items.push(ACTION_DELETE);
        }

        return items;
      },
      orderItems: (context, items) => {
        const actionsOpen = menuExtractItems(items, [ACTION_OPEN]);
        const actionsManage = menuExtractItems(items, [ACTION_RENAME, ACTION_DELETE]);
        const actionsRefresh = menuExtractItems(items, [ACTION_REFRESH]);

        items.unshift(...actionsOpen);
        items.push(...actionsManage);

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

  load(): void {}
}
