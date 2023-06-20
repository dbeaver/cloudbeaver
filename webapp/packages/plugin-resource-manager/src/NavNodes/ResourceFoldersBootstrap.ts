/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { UserInfoResource } from '@cloudbeaver/core-authentication';
import { CONNECTION_FOLDER_NAME_VALIDATION } from '@cloudbeaver/core-connections';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';
import { LocalizationService } from '@cloudbeaver/core-localization';
import {
  ENodeMoveType,
  getNodesFromContext,
  type INodeMoveData,
  NavNodeInfoResource,
  NavNodeManagerService,
  navNodeMoveContext,
  NavTreeResource,
  ProjectsNavNodeService,
} from '@cloudbeaver/core-navigation-tree';
import { ProjectInfoResource, ProjectsService } from '@cloudbeaver/core-projects';
import {
  getRmResourceKey,
  getRmResourcePath,
  NAV_NODE_TYPE_RM_PROJECT,
  NAV_NODE_TYPE_RM_RESOURCE,
  ResourceManagerResource,
  RESOURCES_NODE_PATH,
} from '@cloudbeaver/core-resource-manager';
import { CachedMapAllKey, CachedTreeChildrenKey, getCachedMapResourceLoaderState, resourceKeyList, ResourceKeyUtils } from '@cloudbeaver/core-sdk';
import { createPath, getPathParent } from '@cloudbeaver/core-utils';
import {
  ACTION_NEW_FOLDER,
  ActionService,
  DATA_CONTEXT_LOADABLE_STATE,
  DATA_CONTEXT_MENU,
  IAction,
  IDataContextProvider,
  MenuService,
} from '@cloudbeaver/core-view';
import { DATA_CONTEXT_ELEMENTS_TREE, MENU_ELEMENTS_TREE_TOOLS } from '@cloudbeaver/plugin-navigation-tree';
import { FolderDialog } from '@cloudbeaver/plugin-projects';

import { NavResourceNodeService } from '../NavResourceNodeService';
import { ResourceManagerService } from '../ResourceManagerService';
import { DATA_CONTEXT_RESOURCE_MANAGER_TREE_RESOURCE_TYPE_ID } from '../Tree/DATA_CONTEXT_RESOURCE_MANAGER_TREE_RESOURCE_TYPE_ID';
import { getResourceKeyFromNodeId } from './getResourceKeyFromNodeId';
import { getResourceNodeId } from './getResourceNodeId';
import { getRmProjectNodeId } from './getRmProjectNodeId';

interface ITargetNode {
  projectId: string;
  folderId?: string;
  projectNodeId: string;
  selectProject: boolean;
}

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
    private readonly projectsService: ProjectsService,
    private readonly projectInfoResource: ProjectInfoResource,
    private readonly commonDialogService: CommonDialogService,
    private readonly actionService: ActionService,
    private readonly menuService: MenuService,
    private readonly navResourceNodeService: NavResourceNodeService,
    private readonly navNodeInfoResource: NavNodeInfoResource,
    private readonly projectsNavNodeService: ProjectsNavNodeService,
  ) {
    super();
  }

  register(): void | Promise<void> {
    this.syncNavTree();

    this.actionService.addHandler({
      id: 'tree-tools-menu-resource-folders-handler',
      isActionApplicable: (context, action) => {
        const tree = context.tryGet(DATA_CONTEXT_ELEMENTS_TREE);

        if (![ACTION_NEW_FOLDER].includes(action) || !tree?.baseRoot.startsWith(RESOURCES_NODE_PATH) || !this.userInfoResource.data) {
          return false;
        }

        return true;
      },
      getLoader: (context, action) => {
        const state = context.get(DATA_CONTEXT_LOADABLE_STATE);

        return state.getState(action.id, () => getCachedMapResourceLoaderState(this.projectInfoResource, CachedMapAllKey));
      },
      isDisabled: context => this.getTargetNode(context) === undefined,
      handler: this.elementsTreeActionHandler.bind(this),
    });

    this.menuService.addCreator({
      isApplicable: context => context.get(DATA_CONTEXT_MENU) === MENU_ELEMENTS_TREE_TOOLS,
      getItems: (context, items) => {
        if (!items.includes(ACTION_NEW_FOLDER)) {
          return [...items, ACTION_NEW_FOLDER];
        }

        return items;
      },
    });
  }

  load(): void | Promise<void> {}

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
    const resourceTypeId = contexts.tryGet(DATA_CONTEXT_RESOURCE_MANAGER_TREE_RESOURCE_TYPE_ID);
    switch (action) {
      case ACTION_NEW_FOLDER: {
        const targetNode = this.getTargetNode(contexts);

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
          icon: '/icons/folder.svg#root',
          create: true,
          selectProject: targetNode.selectProject,
          filterProject: project => project.canEditResources,
          validation: async ({ name, folder, projectId }, setMessage) => {
            const trimmed = name.trim();

            if (trimmed.length === 0 || !name.match(CONNECTION_FOLDER_NAME_VALIDATION)) {
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

            this.navTreeResource.refreshTree(getRmProjectNodeId(result.projectId));
          } catch (exception: any) {
            this.notificationService.logException(exception, 'Error occurred while renaming');
          }
        }

        break;
      }
    }
  }

  private getTargetNode(contexts: IDataContextProvider): ITargetNode | undefined {
    const tree = contexts.get(DATA_CONTEXT_ELEMENTS_TREE);

    if (!tree) {
      return undefined;
    }

    const selected = tree.getSelected();

    if (selected.length === 0) {
      const editableProjects = this.projectsService.activeProjects.filter(project => project.canEditResources);

      if (editableProjects.length > 0) {
        const project = editableProjects[0];

        return {
          projectId: project.id,
          projectNodeId: getRmProjectNodeId(project.id),
          selectProject: editableProjects.length > 1,
        };
      }
      return;
    }

    const targetFolder = selected[0];
    const parentIds = [...this.navNodeInfoResource.getParents(targetFolder), targetFolder];
    const parents = this.navNodeInfoResource.get(resourceKeyList(parentIds));
    const projectNode = parents.find(parent => parent?.nodeType === NAV_NODE_TYPE_RM_PROJECT);

    if (!projectNode) {
      return;
    }

    const project = this.projectsNavNodeService.getByNodeId(projectNode.id);

    if (!project?.canEditResources) {
      return;
    }

    const targetFolderNode = parents
      .slice()
      .reverse()
      .find(parent => parent?.nodeType === NAV_NODE_TYPE_RM_RESOURCE && parent.folder);

    return {
      projectId: project.id,
      folderId: targetFolderNode?.id,
      projectNodeId: projectNode.id,
      selectProject: false,
    };
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
