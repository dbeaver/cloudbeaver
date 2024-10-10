/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { untracked } from 'mobx';

import { UserInfoResource } from '@cloudbeaver/core-authentication';
import { ConfirmationDialogDelete } from '@cloudbeaver/core-blocks';
import {
  CONNECTION_FOLDER_NAME_VALIDATION,
  ConnectionFolderProjectKey,
  ConnectionFolderResource,
  ConnectionInfoResource,
  ConnectionsManagerService,
  createConnectionFolderParam,
  createConnectionParam,
  getConnectionFolderId,
  getConnectionFolderIdFromNodeId,
  type IConnectionFolderParam,
  type IConnectionInfoParams,
} from '@cloudbeaver/core-connections';
import type { IDataContextProvider } from '@cloudbeaver/core-data-context';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { ExecutorInterrupter, type IExecutionContextProvider } from '@cloudbeaver/core-executor';
import { LocalizationService } from '@cloudbeaver/core-localization';
import {
  ENodeMoveType,
  getNodesFromContext,
  type INodeMoveData,
  NAV_NODE_TYPE_FOLDER,
  type NavNode,
  NavNodeInfoResource,
  NavNodeManagerService,
  navNodeMoveContext,
  NavTreeResource,
  nodeDeleteContext,
  ProjectsNavNodeService,
  ROOT_NODE_PATH,
} from '@cloudbeaver/core-navigation-tree';
import { getProjectNodeId, NAV_NODE_TYPE_PROJECT, ProjectInfoResource } from '@cloudbeaver/core-projects';
import { CachedMapAllKey, resourceKeyList, type ResourceKeySimple, ResourceKeyUtils } from '@cloudbeaver/core-resource';
import { createPath } from '@cloudbeaver/core-utils';
import { ACTION_NEW_FOLDER, ActionService, type IAction, MenuService } from '@cloudbeaver/core-view';
import { DATA_CONTEXT_ELEMENTS_TREE, type IElementsTree, MENU_ELEMENTS_TREE_TOOLS } from '@cloudbeaver/plugin-navigation-tree';
import { FolderDialog } from '@cloudbeaver/plugin-projects';

import { NAV_NODE_TYPE_CONNECTION } from './NAV_NODE_TYPE_CONNECTION.js';

interface ITargetNode {
  projectId: string;
  folderId?: string;

  projectNodeId: string;
  selectProject: boolean;
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
    private readonly connectionsManagerService: ConnectionsManagerService,
    private readonly commonDialogService: CommonDialogService,
    private readonly notificationService: NotificationService,
    private readonly navNodeInfoResource: NavNodeInfoResource,
    private readonly projectInfoResource: ProjectInfoResource,
    private readonly projectsNavNodeService: ProjectsNavNodeService,
  ) {
    super();
  }

  override register(): void {
    this.navNodeInfoResource.onItemUpdate.addHandler(this.syncWithNavTree.bind(this));
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

      const nodes = ResourceKeyUtils.filter(data, nodeId => this.connectionFolderResource.fromNodeId(nodeId) !== undefined)
        .map(nodeId => this.navNodeInfoResource.get(nodeId))
        .filter<NavNode>(Boolean as any)
        .map(node => node.name)
        .join();

      if (!nodes) {
        return;
      }

      const result = await this.commonDialogService.open(ConfirmationDialogDelete, {
        title: 'ui_data_delete_confirmation',
        message: this.localizationService.translate('plugin_connections_connection_folder_delete_confirmation', undefined, { name: nodes }),
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
      contexts: [DATA_CONTEXT_ELEMENTS_TREE],
      isActionApplicable: (context, action) => {
        const tree = context.get(DATA_CONTEXT_ELEMENTS_TREE)!;

        if (action !== ACTION_NEW_FOLDER || !this.userInfoResource.isAuthenticated || tree.baseRoot !== ROOT_NODE_PATH) {
          return false;
        }

        const targetNode = this.getTargetNode(tree);

        return targetNode !== undefined;
      },
      // isDisabled: (context, action) => {
      //   const tree = context.get(DATA_CONTEXT_ELEMENTS_TREE);

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
      menus: [MENU_ELEMENTS_TREE_TOOLS],
      getItems: (context, items) => {
        if (!items.includes(ACTION_NEW_FOLDER)) {
          return [...items, ACTION_NEW_FOLDER];
        }

        return items;
      },
    });
  }

  private async moveConnectionToFolder({ type, targetNode, moveContexts }: INodeMoveData, contexts: IExecutionContextProvider<INodeMoveData>) {
    if (![NAV_NODE_TYPE_PROJECT, NAV_NODE_TYPE_FOLDER].includes(targetNode.nodeType!)) {
      return;
    }

    await this.projectInfoResource.load(CachedMapAllKey);

    const move = contexts.getContext(navNodeMoveContext);
    const nodes = getNodesFromContext(moveContexts);
    const nodeIdList = nodes.map(node => node.id);
    const children = this.navTreeResource.get(targetNode.id) ?? [];
    const targetProject = this.projectsNavNodeService.getProject(targetNode.id);

    const supported = nodes.every(node => {
      if (
        ![NAV_NODE_TYPE_CONNECTION, NAV_NODE_TYPE_FOLDER, NAV_NODE_TYPE_PROJECT].includes(node.nodeType!) ||
        targetProject !== this.projectsNavNodeService.getProject(node.id) ||
        children.includes(node.id) ||
        targetNode.id === node.id
      ) {
        return false;
      }

      return true;
    });

    if (!supported) {
      return;
    }

    if (type === ENodeMoveType.CanDrop) {
      if (targetProject?.canEditDataSources) {
        move.setCanMove(true);
      }
    } else {
      const childrenNode = this.navNodeInfoResource.get(resourceKeyList(children));
      const folderDuplicates = nodes.filter(
        node =>
          node.nodeType === NAV_NODE_TYPE_FOLDER &&
          (childrenNode.some(child => child?.nodeType === NAV_NODE_TYPE_FOLDER && child.name === node.name) ||
            nodes.some(child => child.nodeType === NAV_NODE_TYPE_FOLDER && child.name === node.name && child.id !== node.id)),
      );

      if (folderDuplicates.length > 0) {
        this.notificationService.logError({
          title: 'plugin_connections_connection_folder_move_failed',
          message: this.localizationService.translate('plugin_connections_connection_folder_move_duplication', undefined, {
            name: folderDuplicates.map(node => `"${node.name}"`).join(', '),
          }),
        });
        return;
      }

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
        this.notificationService.logException(exception, 'plugin_connections_connection_folder_move_failed');
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
          this.notificationService.logError({ title: "Can't create folder", message: 'core_projects_no_default_project' });
          return;
        }

        let parentFolderParam: IConnectionFolderParam | undefined;

        if (targetNode.folderId) {
          parentFolderParam = getConnectionFolderIdFromNodeId(targetNode.folderId);
        }

        const result = await this.commonDialogService.open(FolderDialog, {
          value: this.localizationService.translate('ui_folder_new'),
          projectId: targetNode.projectId,
          folder: parentFolderParam?.folderId,
          title: 'core_view_action_new_folder',
          icon: '/icons/folder.svg#root',
          create: true,
          selectProject: targetNode.selectProject,
          validation: async ({ name, folder, projectId }, setMessage) => {
            const trimmed = name.trim();

            if (trimmed.length === 0 || !trimmed.match(CONNECTION_FOLDER_NAME_VALIDATION)) {
              setMessage('connections_connection_folder_validation');
              return false;
            }

            try {
              await this.connectionFolderResource.load(ConnectionFolderProjectKey(projectId));

              return !this.connectionFolderResource.has(createConnectionFolderParam(projectId, createPath(folder, trimmed)));
            } catch (exception: any) {
              setMessage('connections_connection_folder_validation');
              return false;
            }
          },
        });

        if (result !== DialogueStateResult.Rejected && result !== DialogueStateResult.Resolved) {
          try {
            await this.connectionFolderResource.create(result.projectId, result.name, result.folder);
            this.navTreeResource.markOutdated(
              result.folder
                ? getConnectionFolderId(createConnectionFolderParam(result.projectId, result.folder))
                : getProjectNodeId(result.projectId),
            );
          } catch (exception: any) {
            this.notificationService.logException(exception, "Can't create folder");
          }
        }

        break;
      }
    }
  }

  private async syncWithNavTree(key: ResourceKeySimple<string>) {
    const isFolder = ResourceKeyUtils.some(key, nodeId => this.connectionFolderResource.fromNodeId(nodeId) !== undefined);

    if (isFolder) {
      this.connectionFolderResource.markOutdated();
    }
  }

  private getTargetNode(tree: IElementsTree): ITargetNode | undefined {
    untracked(() => this.projectInfoResource.load(CachedMapAllKey));
    const selected = tree.getSelected();

    if (selected.length === 0) {
      const editableProjects = this.connectionsManagerService.createConnectionProjects;

      if (editableProjects.length > 0) {
        const project = editableProjects[0]!;

        return {
          projectId: project.id,
          projectNodeId: getProjectNodeId(project.id),
          selectProject: editableProjects.length > 1,
        };
      }
      return;
    }

    const targetFolder = selected[0]!;
    const parentIds = [...this.navNodeInfoResource.getParents(targetFolder), targetFolder];
    const parents = this.navNodeInfoResource.get(resourceKeyList(parentIds));
    const projectNode = parents.find(parent => parent?.nodeType === NAV_NODE_TYPE_PROJECT);

    if (!projectNode) {
      return;
    }

    const project = this.projectsNavNodeService.getByNodeId(projectNode.id);

    if (!project?.canEditDataSources) {
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
      selectProject: false,
    };
  }
}
