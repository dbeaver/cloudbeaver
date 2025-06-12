/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { UserInfoResource } from '@cloudbeaver/core-authentication';
import { CONNECTION_FOLDER_NAME_VALIDATION } from '@cloudbeaver/core-connections';
import type { IDataContextProvider } from '@cloudbeaver/core-data-context';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';
import { LocalizationService } from '@cloudbeaver/core-localization';
import {
  ENodeMoveType,
  getNodesFromContext,
  type INodeMoveData,
  NavNodeManagerService,
  navNodeMoveContext,
  NavTreeResource,
  ProjectsNavNodeService,
} from '@cloudbeaver/core-navigation-tree';
import { ProjectInfoResource } from '@cloudbeaver/core-projects';
import {
  CachedMapAllKey,
  CachedTreeChildrenKey,
  getCachedMapResourceLoaderState,
  resourceKeyList,
  ResourceKeyUtils,
} from '@cloudbeaver/core-resource';
import {
  getRmResourceKey,
  getRmResourcePath,
  isRMProjectNode,
  isRMResourceNode,
  NAV_NODE_TYPE_RM_PROJECT,
  NAV_NODE_TYPE_RM_RESOURCE,
  ResourceManagerResource,
  RESOURCES_NODE_PATH,
} from '@cloudbeaver/core-resource-manager';
import { createPath, getPathParent } from '@cloudbeaver/core-utils';
import { ACTION_NEW_FOLDER, ActionService, type IAction, MenuService } from '@cloudbeaver/core-view';
import { DATA_CONTEXT_ELEMENTS_TREE, MENU_ELEMENTS_TREE_TOOLS, TreeSelectionService } from '@cloudbeaver/plugin-navigation-tree';
import { FolderDialog } from '@cloudbeaver/plugin-projects';
import { ResourceManagerService } from '@cloudbeaver/plugin-resource-manager';

import { NavResourceNodeService } from '../NavResourceNodeService.js';
import { DATA_CONTEXT_RESOURCE_MANAGER_TREE_RESOURCE_TYPE_ID } from '../Tree/DATA_CONTEXT_RESOURCE_MANAGER_TREE_RESOURCE_TYPE_ID.js';
import { getResourceKeyFromNodeId } from './getResourceKeyFromNodeId.js';
import { getResourceNodeId } from './getResourceNodeId.js';
import { getRmProjectNodeId } from './getRmProjectNodeId.js';

@injectable()
export class ResourceFoldersBootstrap extends Bootstrap {
  constructor(
    private readonly localizationService: LocalizationService,
    private readonly navTreeResource: NavTreeResource,
    private readonly notificationService: NotificationService,
    private readonly userInfoResource: UserInfoResource,
    private readonly navNodeManagerService: NavNodeManagerService,
    private readonly resourceManagerResource: ResourceManagerResource,
    private readonly resourceManagerService: ResourceManagerService,
    private readonly projectInfoResource: ProjectInfoResource,
    private readonly commonDialogService: CommonDialogService,
    private readonly actionService: ActionService,
    private readonly menuService: MenuService,
    private readonly navResourceNodeService: NavResourceNodeService,
    private readonly treeSelectionService: TreeSelectionService,
    private readonly projectsNavNodeService: ProjectsNavNodeService,
  ) {
    super();
  }

  override register(): void {
    this.syncNavTree();

    this.actionService.addHandler({
      id: 'tree-tools-menu-resource-folders-handler',
      actions: [ACTION_NEW_FOLDER],
      contexts: [DATA_CONTEXT_ELEMENTS_TREE, DATA_CONTEXT_RESOURCE_MANAGER_TREE_RESOURCE_TYPE_ID],
      isActionApplicable: context => {
        const tree = context.get(DATA_CONTEXT_ELEMENTS_TREE)!;

        if (!tree.baseRoot.startsWith(RESOURCES_NODE_PATH) || !this.userInfoResource.isAuthenticated()) {
          return false;
        }

        return true;
      },
      getLoader: () => getCachedMapResourceLoaderState(this.projectInfoResource, () => CachedMapAllKey),
      isDisabled: context => {
        const tree = context.get(DATA_CONTEXT_ELEMENTS_TREE)!;

        return (
          this.treeSelectionService.getFirstSelectedNode(
            tree,
            getRmProjectNodeId,
            project => project.canEditResources,
            isRMProjectNode,
            node => isRMResourceNode(node) && Boolean(node?.folder),
          ) === undefined
        );
      },
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

  private async moveResourceToFolder({ type, targetNode, moveContexts }: INodeMoveData, contexts: IExecutionContextProvider<INodeMoveData>) {
    const move = contexts.getContext(navNodeMoveContext);
    const nodes = getNodesFromContext(moveContexts);
    const nodeIdList = nodes.map(node => node.id);
    const children = this.navTreeResource.get(targetNode.id) ?? [];
    const targetProject = this.projectsNavNodeService.getProject(targetNode.id);

    if (!targetProject?.canEditResources || (!targetNode.folder && targetNode.nodeType !== NAV_NODE_TYPE_RM_PROJECT)) {
      return;
    }

    const supported = nodes.every(node => {
      if (
        ![NAV_NODE_TYPE_RM_PROJECT, NAV_NODE_TYPE_RM_RESOURCE].includes(node.nodeType!) ||
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

    if (type === ENodeMoveType.CanDrop && targetNode.nodeType) {
      move.setCanMove(true);
    } else {
      try {
        const targetRmFolderId = getResourceKeyFromNodeId(targetNode.id);

        if (targetRmFolderId) {
          for (const nodeId of nodeIdList) {
            const rmNodeId = getResourceKeyFromNodeId(nodeId);
            if (rmNodeId) {
              const key = getRmResourceKey(rmNodeId);
              if (key.name) {
                await this.navResourceNodeService.move(rmNodeId, createPath(targetRmFolderId, key.name));
              }
            }
          }
        }
      } catch (exception: any) {
        this.notificationService.logException(exception, 'plugin_resource_manager_folder_move_failed');
      }
    }
  }

  private async elementsTreeActionHandler(contexts: IDataContextProvider, action: IAction) {
    const resourceTypeId = contexts.get(DATA_CONTEXT_RESOURCE_MANAGER_TREE_RESOURCE_TYPE_ID)!;
    const tree = contexts.get(DATA_CONTEXT_ELEMENTS_TREE)!;

    switch (action) {
      case ACTION_NEW_FOLDER: {
        const targetNode = this.treeSelectionService.getFirstSelectedNode(
          tree,
          getRmProjectNodeId,
          project => project.canEditResources,
          isRMProjectNode,
          node => isRMResourceNode(node) && Boolean(node?.folder),
        );

        if (!targetNode) {
          return;
        }

        let path: string | undefined;

        if (targetNode.folderId) {
          const resourceKey = getResourceKeyFromNodeId(targetNode.folderId);

          if (resourceKey !== undefined) {
            const key = getRmResourceKey(resourceKey);
            if (key.path) {
              path = key.path;
            }
          }
        }

        const result = await this.commonDialogService.open(FolderDialog, {
          value: this.localizationService.translate('ui_folder_new'),
          projectId: targetNode.projectId,
          folder: path,
          title: 'core_view_action_new_folder',
          icon: '/icons/folder.svg',
          create: true,
          selectProject: targetNode.selectProject,
          filterProject: project => project.canEditResources,
          validation: async ({ name, folder, projectId }, setMessage) => {
            const trimmed = name.trim();

            if (trimmed.length === 0 || !trimmed.match(CONNECTION_FOLDER_NAME_VALIDATION)) {
              setMessage('connections_connection_folder_validation');
              return false;
            }

            const root = this.getResourceTypeFolder(projectId, resourceTypeId);
            const key = getRmResourcePath(projectId, folder ?? root);

            try {
              await this.resourceManagerResource.load(CachedTreeChildrenKey(key));

              return !this.resourceManagerResource.has(createPath(key, trimmed));
            } catch (exception: any) {
              setMessage('connections_connection_folder_validation');
              return false;
            }
          },
        });

        if (result !== DialogueStateResult.Rejected && result !== DialogueStateResult.Resolved) {
          try {
            const root = this.getResourceTypeFolder(result.projectId, resourceTypeId);
            const key = getRmResourcePath(result.projectId, result.folder ?? root);
            await this.resourceManagerResource.create(createPath(key, result.name), true);

            this.navTreeResource.refreshNode(getRmProjectNodeId(result.projectId));
          } catch (exception: any) {
            this.notificationService.logException(exception, 'Error occurred while renaming');
          }
        }

        break;
      }
    }
  }

  private getResourceTypeFolder(projectId: string, resourceTypeId: string | undefined): string | undefined {
    if (!resourceTypeId) {
      return undefined;
    }
    const project = this.projectInfoResource.get(projectId);

    if (!project) {
      return undefined;
    }

    const resourceFolder = this.resourceManagerService.getRootFolder(project, resourceTypeId);
    return resourceFolder;
  }

  private syncNavTree() {
    this.navNodeManagerService.onMove.addHandler(this.moveResourceToFolder.bind(this));

    this.resourceManagerResource.onItemUpdate.addHandler(key => {
      const updated = resourceKeyList([...new Set(ResourceKeyUtils.mapArray(key, getResourceNodeId).map(getPathParent))]);
      if (!this.navTreeResource.isOutdated(updated)) {
        this.navTreeResource.markTreeOutdated(updated);
      }
    });

    this.resourceManagerResource.onItemDelete.addHandler(key => {
      const updated = resourceKeyList([...new Set(ResourceKeyUtils.mapArray(key, getResourceNodeId).map(getPathParent))]);
      this.navTreeResource.deleteInNode(
        updated,
        ResourceKeyUtils.toArray(key).map(value => [value]),
      );
    });
  }
}
