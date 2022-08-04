/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */


import { untracked } from 'mobx';

import { UserInfoResource } from '@cloudbeaver/core-authentication';
import { ConnectionFolder, ConnectionFolderProjectKey, ConnectionFolderResource, ConnectionInfoResource, CONNECTION_FOLDER_NAME_VALIDATION, createConnectionFolderParam, createConnectionParam, IConnectionInfoParams } from '@cloudbeaver/core-connections';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { CommonDialogService, ConfirmationDialogDelete, DialogueStateResult, RenameDialog } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { ExecutorInterrupter, IExecutionContextProvider } from '@cloudbeaver/core-executor';
import { LocalizationService } from '@cloudbeaver/core-localization';
import { ENodeMoveType, getNodesFromContext, INodeMoveData, NavNode, NavNodeInfoResource, NavNodeManagerService, navNodeMoveContext, NavTreeResource, NAV_NODE_TYPE_FOLDER, nodeDeleteContext, ROOT_NODE_PATH } from '@cloudbeaver/core-navigation-tree';
import { NAV_NODE_TYPE_PROJECT, ProjectsNavNodeService, ProjectsResource } from '@cloudbeaver/core-projects';
import { CachedMapAllKey, ResourceKey, resourceKeyList, ResourceKeyUtils } from '@cloudbeaver/core-sdk';
import { createPath } from '@cloudbeaver/core-utils';
import { ActionService, ACTION_NEW_FOLDER, DATA_CONTEXT_MENU, IAction, IDataContextProvider, MenuService } from '@cloudbeaver/core-view';
import { DATA_CONTEXT_ELEMENTS_TREE, MENU_ELEMENTS_TREE_TOOLS, type IElementsTree } from '@cloudbeaver/plugin-navigation-tree';

import { NAV_NODE_TYPE_CONNECTION } from './NAV_NODE_TYPE_CONNECTION';

interface ITargetNode {
  projectId: string;
  folderId?: string;

  projectNodeId: string;
}

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
    private readonly navNodeInfoResource: NavNodeInfoResource,
    private readonly projectsResource: ProjectsResource,
    private readonly projectsNavNodeService: ProjectsNavNodeService
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
        if (action !== ACTION_NEW_FOLDER) {
          return false;
        }

        const tree = context.tryGet(DATA_CONTEXT_ELEMENTS_TREE);

        if (!tree || !this.userInfoResource.data) {
          return false;
        }
        const targetNode = this.getTargetNode(tree);

        return targetNode !== undefined;
      },
      // isDisabled: (context, action) => {
      //   const tree = context.tryGet(DATA_CONTEXT_ELEMENTS_TREE);

      //   if (!tree) {
      //     return true;
      //   }

      //   if (action === ACTION_NEW_FOLDER) {
      //     const targetNode = this.getTargetNode(tree);

      //     return targetNode === undefined;
      //   }

      //   return false;
      // },
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
    await this.projectsResource.load(CachedMapAllKey);

    const move = contexts.getContext(navNodeMoveContext);
    const nodes = getNodesFromContext(moveContexts);
    const nodeIdList = nodes.map(node => node.id);
    const children = this.navTreeResource.get(targetNode.id);
    const targetProject = this.projectsNavNodeService.getProject(targetNode.id);

    const supported = (
      [NAV_NODE_TYPE_PROJECT, NAV_NODE_TYPE_FOLDER].includes(targetNode.nodeType!)
        && nodes.every(node => (
          node.nodeType === NAV_NODE_TYPE_CONNECTION
          && targetProject === this.projectsNavNodeService.getProject(node.id)
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
          .map(nodeId => {
            const connection = this.connectionInfoResource.getConnectionForNode(nodeId);

            if (connection) {
              return createConnectionParam(connection);
            }

            return null;
          })
          .filter<IConnectionInfoParams>(Boolean as any);

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
        const targetNode = this.getTargetNode(tree);

        if (!targetNode) {
          this.notificationService.logError({ title:'Can\'t create folder', message: 'core_projects_project_not' });
          return;
        }

        await this.connectionFolderResource.load(ConnectionFolderProjectKey(targetNode.projectId));

        let folder: ConnectionFolder | undefined;

        if (targetNode.folderId) {
          folder = this.connectionFolderResource.fromNodeId(targetNode.folderId);

          if (!folder) {
            this.notificationService.logError({ title:'Can\'t create folder', message: 'Folder not found' });
            return;
          }
        }

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

            return !this.connectionFolderResource.has(createConnectionFolderParam(
              targetNode.projectId,
              createPath(folder?.id, trimmed)
            ));
          },
        });

        if (result !== DialogueStateResult.Rejected && result !== DialogueStateResult.Resolved) {
          try {
            await this.connectionFolderResource.create(createConnectionFolderParam(
              targetNode.projectId,
              result
            ), folder?.id);
            this.navTreeResource.markOutdated(
              targetNode.folderId !== undefined
                ? targetNode.folderId
                : targetNode.projectNodeId
            );
          } catch (exception: any) {
            this.notificationService.logException(exception, 'Can\'t create folder');
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

  private getTargetNode(tree: IElementsTree): ITargetNode | undefined {
    const selected = tree.getSelected();

    if (selected.length === 0) {
      selected.push(tree.root);
    }

    const targetFolder = selected[0];
    const parentIds = [...this.navNodeInfoResource.getParents(targetFolder), targetFolder];
    const parents = this.navNodeInfoResource.get(resourceKeyList(parentIds));
    const projectNode = parents.find(parent => parent?.nodeType === NAV_NODE_TYPE_PROJECT);

    if (!projectNode) {
      return;
    }

    untracked(() => this.projectsResource.load(CachedMapAllKey));

    const project = this.projectsNavNodeService.getByNodeId(projectNode.id);

    if (!project?.canCreateConnections) {
      return;
    }

    const targetFolderNode = parents
      .slice()
      .reverse()
      .find(parent => parent?.nodeType === NAV_NODE_TYPE_FOLDER);

    return {
      projectId: project.id,
      folderId: targetFolderNode?.id,
      projectNodeId: projectNode.id,
    };
  }
}