/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { untracked } from 'mobx';

import { DATA_CONTEXT_ELEMENTS_TREE, DATA_CONTEXT_NAV_NODE, ElementsTreeToolsMenuService, ENodeMoveType, getNodeName, getNodesFromContext, INodeMoveData, MENU_ELEMENTS_TREE_TOOLS, NavNodeManagerService, navNodeMoveContext, NavTreeResource, NAV_NODE_TYPE_FOLDER, NAV_NODE_TYPE_ROOT, ROOT_NODE_PATH } from '@cloudbeaver/core-app';
import { ConnectionFolderResource, ConnectionInfoResource, CONNECTION_FOLDER_NAME_VALIDATION, EConnectionFeature } from '@cloudbeaver/core-connections';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { CommonDialogService, ConfirmationDialogDelete, DialogueStateResult, RenameDialog } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';
import { CachedMapAllKey, resourceKeyList } from '@cloudbeaver/core-sdk';
import { ActionService, ACTION_DELETE, ACTION_NEW_FOLDER, DATA_CONTEXT_MENU, IAction, IDataContextProvider, KeyBindingService, MenuService } from '@cloudbeaver/core-view';

import { NAV_NODE_TYPE_CONNECTION } from './NAV_NODE_TYPE_CONNECTION';

@injectable()
export class ConnectionFoldersBootstrap extends Bootstrap {

  constructor(
    private readonly navTreeResource: NavTreeResource,
    private readonly actionService: ActionService,
    private readonly keyBindingService: KeyBindingService,
    private readonly menuService: MenuService,
    private readonly elementsTreeToolsMenuService: ElementsTreeToolsMenuService,
    private readonly connectionInfoResource: ConnectionInfoResource,
    private readonly navNodeManagerService: NavNodeManagerService,
    private readonly connectionFolderResource: ConnectionFolderResource,
    private readonly commonDialogService: CommonDialogService,
    private readonly notificationService: NotificationService
  ) {
    super();
  }

  register(): void | Promise<void> {
    this.navNodeManagerService.onMove.addHandler(this.moveConnectionToFolder.bind(this));

    this.actionService.addHandler({
      id: 'tree-tools-menu-folders-handler',
      isActionApplicable(context, action) {
        const tree = context.tryGet(DATA_CONTEXT_ELEMENTS_TREE);

        if (tree?.baseRoot !== ROOT_NODE_PATH) {
          return false;
        }

        return [ACTION_NEW_FOLDER].includes(action);
      },
      handler: this.elementsTreeActionHandler.bind(this),
    });

    this.menuService.addCreator({
      isApplicable: context => context.get(DATA_CONTEXT_MENU) === MENU_ELEMENTS_TREE_TOOLS,
      getItems: (context, items) => [
        ...items,
        ACTION_NEW_FOLDER,
      ],
    });


    this.actionService.addHandler({
      id: 'nav-node-folder-handler',
      isActionApplicable: (context, action): boolean => {
        const node = context.tryGet(DATA_CONTEXT_NAV_NODE);

        if (!node) {
          return false;
        }

        if (action === ACTION_DELETE) {
          untracked(() => { this.connectionFolderResource.load(CachedMapAllKey); });
          const folder = this.connectionFolderResource.fromNodeId(node.id);

          return folder !== undefined;
        }

        return false;
      },
      handler: async (context, action) => {
        const node = context.get(DATA_CONTEXT_NAV_NODE);

        switch (action) {
          case ACTION_DELETE: {
            const folder = this.connectionFolderResource.fromNodeId(node.id);
            if (!folder) {
              return;
            }

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
              await this.connectionFolderResource.deleteFolder(
                ConnectionFolderResource.baseProject,
                folder.id
              );
            } catch (exception: any) {
              this.notificationService.logException(exception, `Failed to delete "${nodeName}"`);
            }
            break;
          }
        }
      },
    });

  }
  load(): void | Promise<void> { }

  private async moveConnectionToFolder(
    {
      type,
      targetNode,
      moveContexts,
    }: INodeMoveData,
    contexts: IExecutionContextProvider<INodeMoveData>
  ) {
    const move = contexts.getContext(navNodeMoveContext);
    const nodes = getNodesFromContext(moveContexts);
    const children = this.navTreeResource.get(targetNode.id);

    if (type === ENodeMoveType.CanDrop && targetNode.nodeType) {
      if (
        [NAV_NODE_TYPE_ROOT, NAV_NODE_TYPE_FOLDER].includes(targetNode.nodeType)
        && nodes.every(node => (
          node.nodeType === NAV_NODE_TYPE_CONNECTION
          && this.connectionInfoResource.getConnectionForNode(node.id)?.features.includes(EConnectionFeature.manageable)
          && !children?.includes(node.id)
        ))
      ) {
        move.setCanMove(true);
      }
    } else {
      await this.navTreeResource.moveTo(resourceKeyList(nodes.map(node => node.id)), targetNode.id);
    }
  }

  private async elementsTreeActionHandler(contexts: IDataContextProvider, action: IAction) {
    const tree = contexts.get(DATA_CONTEXT_ELEMENTS_TREE);

    if (tree === undefined) {
      return;
    }

    switch (action) {
      case ACTION_NEW_FOLDER: {
        await this.connectionFolderResource.load(CachedMapAllKey);

        const selected = tree.getSelected();

        if (selected.length === 0) {
          selected.push(tree.root);
        }

        const targetFolder = selected[0];
        const folder = this.connectionFolderResource.fromNodeId(targetFolder);

        const result = await this.commonDialogService.open(RenameDialog, {
          value: 'Folder',
          title: 'core_view_action_new_folder',
          subTitle: folder?.id,
          // icon: node.icon,
          create: true,
          validation: name => {
            const trimmed = name.trim();

            if (trimmed.length === 0 || !name.match(CONNECTION_FOLDER_NAME_VALIDATION)) {
              return false;
            }

            return this.connectionFolderResource.getFolder(
              ConnectionFolderResource.baseProject,
              [folder?.id, trimmed].filter(Boolean).join('/')
            ) === undefined;
          },
        });

        if (result !== DialogueStateResult.Rejected && result !== DialogueStateResult.Resolved) {
          try {
            await this.connectionFolderResource.create(result, folder?.id);
            await tree.refresh(targetFolder);
          } catch (exception: any) {
            this.notificationService.logException(exception, 'Error occurred while renaming');
          }
        }

        break;
      }
    }
  }
}