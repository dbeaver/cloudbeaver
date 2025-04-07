/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { UserInfoResource } from '@cloudbeaver/core-authentication';
import { ConfirmationDialogDelete } from '@cloudbeaver/core-blocks';
import {
  CONNECTION_FOLDER_NAME_VALIDATION,
  ConnectionFolderProjectKey,
  ConnectionFolderResource,
  ConnectionInfoResource,
  createConnectionFolderParam,
  createConnectionParam,
  getConnectionFolderId,
  getConnectionFolderIdFromNodeId,
  type IConnectionFolderParam,
  type IConnectionInfoParams,
  isConnectionNode,
} from '@cloudbeaver/core-connections';
import type { IDataContextProvider } from '@cloudbeaver/core-data-context';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { ExecutorInterrupter, type IExecutionContextProvider } from '@cloudbeaver/core-executor';
import { LocalizationService } from '@cloudbeaver/core-localization';
import {
  DATA_CONTEXT_NAV_NODE,
  ENodeMoveType,
  getNodesFromContext,
  type INodeMoveData,
  isConnectionFolder,
  isProjectNode,
  type NavNode,
  NavNodeInfoResource,
  NavNodeManagerService,
  navNodeMoveContext,
  NavTreeResource,
  nodeDeleteContext,
  ProjectsNavNodeService,
  ROOT_NODE_PATH,
} from '@cloudbeaver/core-navigation-tree';
import { getProjectNodeId, ProjectInfoResource } from '@cloudbeaver/core-projects';
import {
  CachedMapAllKey,
  getCachedMapResourceLoaderState,
  resourceKeyList,
  type ResourceKeySimple,
  ResourceKeyUtils,
} from '@cloudbeaver/core-resource';
import { createPath } from '@cloudbeaver/core-utils';
import { ACTION_NEW_FOLDER, ActionService, type IAction, MenuService } from '@cloudbeaver/core-view';
import {
  DATA_CONTEXT_ELEMENTS_TREE,
  MENU_ELEMENTS_TREE_TOOLS,
  MENU_NAVIGATION_TREE_CREATE,
  TreeSelectionService,
} from '@cloudbeaver/plugin-navigation-tree';
import { FolderDialog } from '@cloudbeaver/plugin-projects';

import { ACTION_TREE_CREATE_FOLDER } from '../Actions/ACTION_TREE_CREATE_FOLDER.js';

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
    private readonly projectInfoResource: ProjectInfoResource,
    private readonly projectsNavNodeService: ProjectsNavNodeService,
    // TODO: https://dbeaver.atlassian.net/browse/CB-6272
    // private readonly navigationTreeService: NavigationTreeService,
    private readonly treeSelectionService: TreeSelectionService,
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

        if (action !== ACTION_NEW_FOLDER || !this.userInfoResource.isAuthenticated() || tree.baseRoot !== ROOT_NODE_PATH) {
          return false;
        }

        const targetNode = this.treeSelectionService.getFirstSelectedNode(
          tree,
          getProjectNodeId,
          project => project.canEditDataSources,
          isProjectNode,
          isConnectionFolder,
        );

        return targetNode !== undefined;
      },
      getLoader: (context, action) => getCachedMapResourceLoaderState(this.projectInfoResource, () => CachedMapAllKey),
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

    this.menuService.addCreator({
      // TODO: https://dbeaver.atlassian.net/browse/CB-6272
      // root: true,
      menus: [MENU_NAVIGATION_TREE_CREATE],
      contexts: [DATA_CONTEXT_NAV_NODE, DATA_CONTEXT_ELEMENTS_TREE],
      isApplicable: context => {
        const node = context.get(DATA_CONTEXT_NAV_NODE)!;
        const tree = context.get(DATA_CONTEXT_ELEMENTS_TREE)!;
        const targetNode = this.treeSelectionService.getFirstSelectedNode(
          tree,
          getProjectNodeId,
          project => project.canEditDataSources,
          isProjectNode,
          isConnectionFolder,
        );

        if (
          ![isConnectionFolder, isProjectNode].some(check => check(node)) ||
          !this.userInfoResource.isAuthenticated() ||
          tree.baseRoot !== ROOT_NODE_PATH ||
          targetNode === undefined
        ) {
          return false;
        }

        return true;
      },
      getItems: (context, items) => [...items, ACTION_TREE_CREATE_FOLDER],
    });

    this.actionService.addHandler({
      id: 'nav-tree-create-create-folders-handler',
      // menus: [MENU_NAVIGATION_TREE_CREATE],
      contexts: [DATA_CONTEXT_NAV_NODE, DATA_CONTEXT_ELEMENTS_TREE],
      actions: [ACTION_TREE_CREATE_FOLDER],
      getLoader: (context, action) => getCachedMapResourceLoaderState(this.projectInfoResource, () => CachedMapAllKey),
      handler: this.elementsTreeActionHandler.bind(this),
    });
  }

  private async moveConnectionToFolder({ type, targetNode, moveContexts }: INodeMoveData, contexts: IExecutionContextProvider<INodeMoveData>) {
    if (![isProjectNode, isConnectionFolder].some(check => check(targetNode))) {
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
        ![isConnectionNode, isConnectionFolder, isProjectNode].some(check => check(node)) ||
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
          isConnectionFolder(node) &&
          (childrenNode.some(child => child && isConnectionFolder(child) && child.name === node.name) ||
            nodes.some(child => isConnectionFolder(child) && child.name === node.name && child.id !== node.id)),
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
      case ACTION_TREE_CREATE_FOLDER:
      case ACTION_NEW_FOLDER: {
        const targetNode = this.treeSelectionService.getFirstSelectedNode(
          tree,
          getProjectNodeId,
          project => project.canEditDataSources,
          isProjectNode,
          isConnectionFolder,
        );

        if (!targetNode) {
          this.notificationService.logError({ title: "Can't create folder", message: 'core_projects_no_default_project' });
          return;
        }

        let parentFolderParam: IConnectionFolderParam | undefined;

        if (targetNode.folderId) {
          parentFolderParam = getConnectionFolderIdFromNodeId(targetNode.folderId);
        }

        const result = await this.commonDialogService.open(FolderDialog, {
          value: this.localizationService.translate('ui_folder_new_default_name'),
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

            // TODO: https://dbeaver.atlassian.net/browse/CB-6272
            // const newFolderId = getConnectionFolderId(createConnectionFolderParam(result.projectId, createPath(result.folder, result.name)));
            // await this.navNodeInfoResource.loadNodeParents(newFolderId);
            // await this.navigationTreeService.showNode(newFolderId, this.navNodeInfoResource.getParents(newFolderId));
          } catch (exception: any) {
            this.notificationService.logException(exception, "Can't create folder");
          }
        }

        break;
      }
    }
  }

  private syncWithNavTree(key: ResourceKeySimple<string>) {
    const isFolder = ResourceKeyUtils.some(key, nodeId => this.connectionFolderResource.fromNodeId(nodeId) !== undefined);

    if (isFolder) {
      this.connectionFolderResource.markOutdated();
    }
  }
}
