/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */


import { UserInfoResource } from '@cloudbeaver/core-authentication';
import { ConnectionFolderResource, ConnectionInfoResource, CONNECTION_FOLDER_NAME_VALIDATION } from '@cloudbeaver/core-connections';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { CommonDialogService, ConfirmationDialogDelete, DialogueStateResult, RenameDialog } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { ExecutorInterrupter, IExecutionContextProvider } from '@cloudbeaver/core-executor';
import { LocalizationService } from '@cloudbeaver/core-localization';
import { ENodeFeature, ENodeMoveType, getNodesFromContext, INodeMoveData, NavNode, NavNodeInfoResource, NavNodeManagerService, navNodeMoveContext, NavTreeResource, NAV_NODE_TYPE_FOLDER, NAV_NODE_TYPE_ROOT, nodeDeleteContext, ROOT_NODE_PATH } from '@cloudbeaver/core-navigation-tree';
import { CachedMapAllKey, ResourceKey, resourceKeyList, ResourceKeyUtils } from '@cloudbeaver/core-sdk';
import { ActionService, ACTION_NEW_FOLDER, DATA_CONTEXT_MENU, IAction, IDataContextProvider, MenuService } from '@cloudbeaver/core-view';
import { DATA_CONTEXT_ELEMENTS_TREE, MENU_ELEMENTS_TREE_TOOLS, type IElementsTree } from '@cloudbeaver/plugin-navigation-tree';

import { NAV_NODE_TYPE_CONNECTION } from './NAV_NODE_TYPE_CONNECTION';

@injectable()
export class ConnectionFoldersBootstrap extends Bootstrap {

  constructor(
    private readonly localizationService: LocalizationService,
    private readonly userInfoResource: UserInfoResource,
    private readonly navTreeResource: NavTreeResource,
    private readonly actionService: ActionService,
    private readonly menuService: MenuService,
    private readonly connectionInfoResource: ConnectionInfoResource,
    private readonly navNodeManagerService: NavNodeManagerService,
    private readonly connectionFolderResource: ConnectionFolderResource,
    private readonly commonDialogService: CommonDialogService,
    private readonly notificationService: NotificationService,
    private readonly navNodeInfoResource: NavNodeInfoResource
  ) {
    super();
  }

  register(): void | Promise<void> {
    this.navNodeInfoResource.onItemAdd.addHandler(this.syncWithNavTree.bind(this));
    this.navNodeInfoResource.onItemDelete.addHandler(this.syncWithNavTree.bind(this));
    this.navNodeManagerService.onMove.addHandler(this.moveConnectionToFolder.bind(this));

    this.navTreeResource.beforeNodeDelete.addHandler(async (data, contexts) => {
      if (ExecutorInterrupter.isInterrupted(contexts)) {
        return;
      }

      const deleteContext = contexts.getContext(nodeDeleteContext);

      if (deleteContext.confirmed) {
        return;
      }
      await this.connectionFolderResource.load(CachedMapAllKey);

      const nodes = ResourceKeyUtils
        .filter(
          data,
          nodeId => this.connectionFolderResource.fromNodeId(nodeId) !== undefined
        )
        .map(nodeId => this.navNodeInfoResource.get(nodeId))
        .filter<NavNode>(Boolean as any)
        .map(node => node.name)
        .join();

      if (!nodes) {
        return;
      }

      const result = await this.commonDialogService.open(ConfirmationDialogDelete, {
        title: 'ui_data_delete_confirmation',
        message: this.localizationService.translate('connections_public_connection_folder_delete_confirmation', undefined, { name: nodes }),
        confirmActionText: 'ui_delete',
      });

      if (result === DialogueStateResult.Rejected) {
        ExecutorInterrupter.interrupt(contexts);
      } else {
        deleteContext.confirm();
      }
    });

    this.actionService.addHandler({
      id: 'tree-tools-menu-folders-handler',
      isActionApplicable: (context, action) => {
        const tree = context.tryGet(DATA_CONTEXT_ELEMENTS_TREE);

        if (tree?.baseRoot !== ROOT_NODE_PATH || !this.userInfoResource.data) {
          return false;
        }

        return [ACTION_NEW_FOLDER].includes(action);
      },
      isDisabled: (context, action) => {
        const tree = context.tryGet(DATA_CONTEXT_ELEMENTS_TREE);

        if (!tree) {
          return true;
        }

        if (action === ACTION_NEW_FOLDER) {
          const targetNode = this.getTargetNode(tree);

          return targetNode === undefined;
        }

        return false;
      },
      handler: this.elementsTreeActionHandler.bind(this),
    });

    this.menuService.addCreator({
      isApplicable: context => context.get(DATA_CONTEXT_MENU) === MENU_ELEMENTS_TREE_TOOLS,
      getItems: (context, items) => {
        if (!items.includes(ACTION_NEW_FOLDER)) {
          return [
            ...items,
            ACTION_NEW_FOLDER,
          ];
        }

        return items;
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
    const nodeIdList = nodes.map(node => node.id);
    const children = this.navTreeResource.get(targetNode.id);

    const supported = (
      [NAV_NODE_TYPE_ROOT, NAV_NODE_TYPE_FOLDER].includes(targetNode.nodeType!)
        && !targetNode.features?.includes(ENodeFeature.shared)
        && nodes.every(node => (
          node.nodeType === NAV_NODE_TYPE_CONNECTION
          && !node.features?.includes(ENodeFeature.shared)
          && !children?.includes(node.id)
        ))
    );

    if (!supported) {
      return;
    }

    if (type === ENodeMoveType.CanDrop && targetNode.nodeType) {
      move.setCanMove(true);
    } else {
      try {
        await this.navTreeResource.moveTo(resourceKeyList(nodeIdList), targetNode.id);
        const connections = nodeIdList
          .map(nodeId => this.connectionInfoResource.getConnectionForNode(nodeId)?.id)
          .filter<string>(Boolean as any);

        this.connectionInfoResource.markOutdated(resourceKeyList(connections));
      } catch (exception: any) {
        this.notificationService.logException(exception, 'connections_public_connection_folder_move_failed');
      }
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
        const targetNode = this.getTargetNode(tree);

        if (!targetNode) {
          return;
        }

        const folder = this.connectionFolderResource.fromNodeId(targetNode.id);

        const result = await this.commonDialogService.open(RenameDialog, {
          value: this.localizationService.translate('ui_folder_new'),
          title: 'core_view_action_new_folder',
          subTitle: folder?.id,
          icon: '/icons/folder.svg#root',
          create: true,
          validation: (name, setMessage) => {
            const trimmed = name.trim();

            if (trimmed.length === 0 || !name.match(CONNECTION_FOLDER_NAME_VALIDATION)) {
              setMessage('connections_connection_folder_validation');
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
            this.navTreeResource.markOutdated(targetNode.parentId);
            this.navTreeResource.markOutdated(targetNode.id);
          } catch (exception: any) {
            this.notificationService.logException(exception, 'Error occurred while renaming');
          }
        }

        break;
      }
    }
  }

  private async syncWithNavTree(key: ResourceKey<string>) {
    const isFolder = ResourceKeyUtils.some(
      key,
      nodeId => this.connectionFolderResource.fromNodeId(nodeId) !== undefined
    );

    if (isFolder) {
      this.connectionFolderResource.markOutdated();
    }
  }

  private getTargetNode(tree: IElementsTree): NavNode | undefined {
    const selected = tree.getSelected();

    if (selected.length === 0) {
      selected.push(tree.root);
    }

    let targetFolder = selected[0];
    let targetNode = this.navNodeInfoResource.get(targetFolder);

    if (![NAV_NODE_TYPE_ROOT, NAV_NODE_TYPE_FOLDER].includes(targetNode?.nodeType as any)) {
      targetFolder = targetNode?.parentId ?? tree.baseRoot;
      targetNode = this.navNodeInfoResource.get(targetFolder);
    }

    if (targetNode?.features?.includes(ENodeFeature.shared)) {
      targetNode = undefined;
    }

    return targetNode;
  }
}