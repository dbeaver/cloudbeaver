/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { untracked } from 'mobx';

import { CoreSettingsService } from '@cloudbeaver/core-app';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { CommonDialogService, ConfirmationDialogDelete, DialogueStateResult, RenameDialog } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { ExecutorInterrupter } from '@cloudbeaver/core-executor';
import { LocalizationService } from '@cloudbeaver/core-localization';
import { type NavNode, type INodeActions, NavNodeManagerService, NavTreeResource, NavNodeInfoResource, NavTreeSettingsService, nodeDeleteContext, DATA_CONTEXT_NAV_NODE, ENodeFeature, getNodeDisplayName } from '@cloudbeaver/core-navigation-tree';
import { ResourceKeyUtils } from '@cloudbeaver/core-sdk';
import { ActionService, ACTION_DELETE, ACTION_OPEN, ACTION_REFRESH, ACTION_RENAME, DATA_CONTEXT_MENU_NESTED, menuExtractActions, MenuSeparatorItem, MenuService } from '@cloudbeaver/core-view';

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
    private readonly navTreeSettingsService: NavTreeSettingsService
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

      const nodes = ResourceKeyUtils
        .mapArray(data, nodeId => this.navNodeInfoResource.get(nodeId))
        .filter<NavNode>(Boolean as any)
        .map(node => node.name)
        .join(', ');

      const result = await this.commonDialogService.open(ConfirmationDialogDelete, {
        title: 'ui_data_delete_confirmation',
        message: this.localizationService.translate('app_navigationTree_node_delete_confirmation', undefined, { name: nodes }),
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

        if (action === ACTION_RENAME) {
          const globalPermission = this.navTreeSettingsService.settings.isValueDefault('editing')
            ? this.coreSettingsService.settings.getValue('app.metadata.editing')
            : this.navTreeSettingsService.settings.getValue('editing');

          if (!globalPermission) {
            return false;
          }

          return !!node.features?.includes(ENodeFeature.canRename);
        }

        if (action === ACTION_DELETE) {
          const globalPermission = this.navTreeSettingsService.settings.isValueDefault('deleting')
            ? this.coreSettingsService.settings.getValue('app.metadata.deleting')
            : this.navTreeSettingsService.settings.getValue('deleting');

          if (!globalPermission) {
            return false;
          }

          return !!node.features?.includes(ENodeFeature.canDelete);
        }

        if (action === ACTION_OPEN) {
          untracked(() => {
            this.navNodeManagerService.canOpen(node.id, node.parentId); // trigger info
          });

          return this.navNodeManagerService.getNavNodeCache(node.id).canOpen;
        }

        return [
          ACTION_REFRESH,
        ].includes(action);
      },
      handler: async (context, action) => {
        const node = context.get(DATA_CONTEXT_NAV_NODE);
        const name = getNodeDisplayName(node);

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

            if (actions?.rename) {
              actions.rename();
            } else {
              const result = await this.commonDialogService.open(RenameDialog, {
                value: name,
                subTitle: name,
                objectName: node.nodeType || 'Object',
                icon: node.icon,
                validation: name => name.trim().length > 0,
              });

              if (result !== DialogueStateResult.Rejected && result !== DialogueStateResult.Resolved) {
                if (name !== result && result.trim().length) {
                  try {
                    await this.navTreeResource.changeName(node, result);
                  } catch (exception: any) {
                    this.notificationService.logException(exception, 'app_navigationTree_node_rename_error');
                  }
                }
              }
            }
            break;
          }
          case ACTION_DELETE: {
            try {
              await this.navTreeResource.deleteNode(node.id);
            } catch (exception: any) {
              this.notificationService.logException(exception, this.localizationService.translate('app_navigationTree_node_delete_error', undefined, { name }));
            }
            break;
          }
        }
      },
    });

    this.menuService.addCreator({
      isApplicable: context => context.has(DATA_CONTEXT_NAV_NODE) && !context.has(DATA_CONTEXT_MENU_NESTED),
      getItems: (context, items) => [
        ...items,
        ACTION_OPEN,
        ACTION_RENAME,
        ACTION_DELETE,
        ACTION_REFRESH,
      ],

      orderItems: (context, items) => {
        const actionsOpen = menuExtractActions(items, [
          ACTION_OPEN,
        ]);

        const actionsManage = menuExtractActions(items, [
          ACTION_RENAME,
          ACTION_DELETE,
        ]);

        const actionsRefresh = menuExtractActions(items, [
          ACTION_REFRESH,
        ]);

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

  load(): void { }
}
