/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { CommonDialogService, ConfirmationDialogDelete, DialogueStateResult, RenameDialog } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { ActionService, ACTION_DELETE, ACTION_OPEN, ACTION_REFRESH, ACTION_RENAME, DATA_CONTEXT_MENU_NESTED, menuExtractActions, MenuSeparatorItem, MenuService } from '@cloudbeaver/core-view';

import { CoreSettingsService } from '../../CoreSettingsService';
import { DATA_CONTEXT_NAV_NODE_ACTIONS } from '../../NavigationTree/ElementsTree/NavigationTreeNode/TreeNodeMenu/DATA_CONTEXT_NAV_NODE_ACTIONS';
import { DATA_CONTEXT_NAV_NODE } from './DATA_CONTEXT_NAV_NODE';
import { ENodeFeature } from './ENodeFeature';
import type { NavNode } from './EntityTypes';
import type { INodeActions } from './INodeActions';
import { getNodeName } from './NavNodeInfoResource';
import { NavNodeManagerService } from './NavNodeManagerService';
import { NavTreeResource } from './NavTreeResource';

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
    private readonly coreSettingsService: CoreSettingsService
  ) {
    super();
  }

  register(): void {
    this.actionService.addHandler({
      id: 'nav-node-base-handler',
      isActionApplicable: (context, action) => {
        const node = context.tryGet(DATA_CONTEXT_NAV_NODE);

        if (!node) {
          return false;
        }

        if (action === ACTION_RENAME) {
          const globalPermission = this.coreSettingsService.settings.getValue('app.metadata.editing');

          if (!globalPermission) {
            return false;
          }

          return !!node.features?.includes(ENodeFeature.canRename);
        }

        if (action === ACTION_DELETE) {
          const globalPermission = this.coreSettingsService.settings.getValue('app.metadata.deleting');

          if (!globalPermission) {
            return false;
          }

          return !!node.features?.includes(ENodeFeature.canDelete);
        }

        return [
          ACTION_OPEN,
          ACTION_REFRESH,
        ].includes(action);
      },
      handler: async (context, action) => {
        const node = context.get(DATA_CONTEXT_NAV_NODE);

        switch (action) {
          case ACTION_OPEN: {
            this.navNodeManagerService.navToNode(node.id, node.parentId);
            break;
          }
          case ACTION_REFRESH: {
            try {
              await this.navNodeManagerService.refreshTree(node.id);
            } catch (exception: any) {
              this.notificationService.logException(exception, 'Failed to refresh node');
            }
            break;
          }
          case ACTION_RENAME: {
            const actions = context.tryGet(DATA_CONTEXT_NAV_NODE_ACTIONS);

            if (actions?.rename) {
              actions.rename();
            } else {
              const name = node.name || '';
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
                    this.notificationService.logException(exception, 'Error occurred while renaming');
                  }
                }
              }
            }
            break;
          }
          case ACTION_DELETE: {
            const nodeName = getNodeName(node);

            const result = await this.commonDialogService.open(ConfirmationDialogDelete, {
              title: 'ui_data_delete_confirmation',
              message: `You're going to delete "${nodeName}". Are you sure?`,
              confirmActionText: 'ui_delete',
            });

            if (result === DialogueStateResult.Rejected) {
              return;
            }

            try {
              await this.navTreeResource.deleteNode(node.id);
            } catch (exception: any) {
              this.notificationService.logException(exception, `Failed to delete "${nodeName}"`);
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
        ACTION_DELETE,
        ACTION_RENAME,
        ACTION_REFRESH,
      ],

      orderItems: (context, items) => {
        const actionsManage = menuExtractActions(items, [
          ACTION_DELETE,
          ACTION_RENAME,
        ]);

        const actionsRefresh = menuExtractActions(items, [
          ACTION_REFRESH,
        ]);

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
