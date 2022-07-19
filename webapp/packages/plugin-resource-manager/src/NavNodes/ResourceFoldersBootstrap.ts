/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { untracked } from 'mobx';

import { UserInfoResource } from '@cloudbeaver/core-authentication';
import { CONNECTION_FOLDER_NAME_VALIDATION } from '@cloudbeaver/core-connections';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { RenameDialog, DialogueStateResult, CommonDialogService } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';
import { LocalizationService } from '@cloudbeaver/core-localization';
import { NavTreeResource, NavNodeManagerService, NavNodeInfoResource, type INodeMoveData, navNodeMoveContext, getNodesFromContext, ENodeMoveType, type NavNode } from '@cloudbeaver/core-navigation-tree';
import { ProjectsResource } from '@cloudbeaver/core-projects';
import { ResourceKey, resourceKeyList, ResourceKeyUtils } from '@cloudbeaver/core-sdk';
import { createPath } from '@cloudbeaver/core-utils';
import { ActionService, MenuService, ACTION_NEW_FOLDER, DATA_CONTEXT_MENU, IAction, IDataContextProvider } from '@cloudbeaver/core-view';
import { DATA_CONTEXT_ELEMENTS_TREE, MENU_ELEMENTS_TREE_TOOLS, type IElementsTree } from '@cloudbeaver/plugin-navigation-tree';

import { NAV_NODE_TYPE_RM_PROJECT } from '../NAV_NODE_TYPE_RM_PROJECT';
import { NavResourceNodeService } from '../NavResourceNodeService';
import { ResourceManagerResource } from '../ResourceManagerResource';
import { RESOURCES_NODE_PATH } from '../RESOURCES_NODE_PATH';
import { NAV_NODE_TYPE_RM_RESOURCE } from './NAV_NODE_TYPE_RM_RESOURCE';

@injectable()
export class ResourceFoldersBootstrap extends Bootstrap {

  constructor(
    private readonly localizationService: LocalizationService,
    private readonly navTreeResource: NavTreeResource,
    private readonly notificationService: NotificationService,
    private readonly userInfoResource: UserInfoResource,
    private readonly navNodeManagerService: NavNodeManagerService,
    private readonly navResourceNodeService: NavResourceNodeService,
    private readonly resourceManagerResource: ResourceManagerResource,
    private readonly projectsResource: ProjectsResource,
    private readonly commonDialogService: CommonDialogService,
    private readonly actionService: ActionService,
    private readonly menuService: MenuService,
    private readonly navNodeInfoResource: NavNodeInfoResource
  ) {
    super();
  }

  register(): void | Promise<void> {
    this.navNodeInfoResource.onItemAdd.addHandler(this.syncWithNavTree.bind(this));
    this.navNodeInfoResource.onItemDelete.addHandler(this.syncWithNavTree.bind(this));
    this.navNodeManagerService.onMove.addHandler(this.moveConnectionToFolder.bind(this));

    this.actionService.addHandler({
      id: 'tree-tools-menu-resource-folders-handler',
      isActionApplicable: (context, action) => {
        const tree = context.tryGet(DATA_CONTEXT_ELEMENTS_TREE);
        if (!tree?.baseRoot.startsWith(RESOURCES_NODE_PATH) || !this.userInfoResource.data) {
          return false;
        }

        return [ACTION_NEW_FOLDER].includes(action);
      },
      isDisabled: (context, action) => {
        const tree = context.tryGet(DATA_CONTEXT_ELEMENTS_TREE);

        if (!tree) {
          return true;
        }

        untracked(async () => await this.projectsResource.load());
        return this.getTargetNode(tree) === undefined;
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

    const data = this.navResourceNodeService.getResourceData(targetNode.id);

    if (!data) {
      return;
    }

    await this.projectsResource.load();
    const projectPath = createPath(RESOURCES_NODE_PATH, this.projectsResource.userProject?.name);

    if (!(this.projectsResource.userProject?.name === data.key.projectId)) {
      return;
    }

    const supported = (
      (
        [NAV_NODE_TYPE_RM_PROJECT, NAV_NODE_TYPE_RM_RESOURCE].includes(targetNode.nodeType!)
        || targetNode.id === projectPath
      )
      && (targetNode.folder || NAV_NODE_TYPE_RM_PROJECT === targetNode.nodeType)
      && nodes.every(node => (
        node.nodeType === NAV_NODE_TYPE_RM_RESOURCE
        && node.id !== targetNode.id
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
        await this.navTreeResource.refreshTree(RESOURCES_NODE_PATH);
      } catch (exception: any) {
        this.notificationService.logException(exception, 'plugin_resource_manager_folder_move_failed');
      }
    }
  }


  private async elementsTreeActionHandler(contexts: IDataContextProvider, action: IAction) {
    const tree = contexts.get(DATA_CONTEXT_ELEMENTS_TREE);

    if (tree === undefined) {
      return;
    }
    await this.projectsResource.load();

    switch (action) {
      case ACTION_NEW_FOLDER: {
        const targetNode = this.getTargetNode(tree);

        if (!targetNode) {
          return;
        }

        const folderData = this.navResourceNodeService.getResourceData(targetNode.id);

        if (!folderData) {
          return;
        }

        let { key } = folderData;

        await this.resourceManagerResource.load(key);
        const resourceData = this.resourceManagerResource.getResource(key, folderData.name);

        if (resourceData?.folder) {
          key = { ...key, folder: createPath(key.folder, resourceData.name) };
          await this.resourceManagerResource.load(key);
        }

        const result = await this.commonDialogService.open(RenameDialog, {
          value: this.localizationService.translate('ui_folder_new'),
          title: 'core_view_action_new_folder',
          subTitle: key.folder,
          icon: '/icons/folder.svg#root',
          create: true,
          validation: (name, setMessage) => {
            const trimmed = name.trim();

            if (trimmed.length === 0 || !name.match(CONNECTION_FOLDER_NAME_VALIDATION)) {
              setMessage('connections_connection_folder_validation');
              return false;
            }

            const folder = this.resourceManagerResource.getResource(key, trimmed);

            return folder === undefined;
          },
        });

        if (result !== DialogueStateResult.Rejected && result !== DialogueStateResult.Resolved) {
          try {
            await this.resourceManagerResource.createResource(
              key.projectId,
              createPath(key.folder, result),
              true
            );

            this.navTreeResource.refreshTree(targetNode.parentId);
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
      nodeId => this.navResourceNodeService.getResourceData(nodeId) !== undefined
    );

    if (isFolder) {
      this.resourceManagerResource.markOutdated();
    }
  }

  private getTargetNode(tree: IElementsTree): NavNode | undefined {
    const selected = tree.getSelected();

    if (selected.length === 0) {
      selected.push(tree.root);
    }

    let targetFolder = selected[0];
    let targetNode = this.navNodeInfoResource.get(targetFolder);

    if (![NAV_NODE_TYPE_RM_PROJECT, NAV_NODE_TYPE_RM_RESOURCE].includes(targetNode?.nodeType as any)) {
      targetFolder = tree.baseRoot;
      targetNode = this.navNodeInfoResource.get(targetFolder);
    }

    const projectPath = createPath(RESOURCES_NODE_PATH, this.projectsResource.userProject?.name);
    if (!targetNode?.id.startsWith(projectPath)) {
      targetNode = undefined;
    }

    return targetNode;
  }
}