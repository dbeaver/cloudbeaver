/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { ConnectionsManagerService, getFolderPath } from '@cloudbeaver/core-connections';
import type { IDataContextProvider } from '@cloudbeaver/core-data-context';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { CommonDialogService } from '@cloudbeaver/core-dialogs';
import { DATA_CONTEXT_NAV_NODE, isConnectionFolder, isProjectNode } from '@cloudbeaver/core-navigation-tree';
import { getProjectNodeId, ProjectInfoResource } from '@cloudbeaver/core-projects';
import { CachedMapAllKey, getCachedMapResourceLoaderState } from '@cloudbeaver/core-resource';
import { ActionService, DATA_CONTEXT_MENU, type IAction, MenuService } from '@cloudbeaver/core-view';
import { ACTION_TREE_CREATE_CONNECTION, MENU_CONNECTIONS } from '@cloudbeaver/plugin-connections';
import {
  DATA_CONTEXT_ELEMENTS_TREE,
  MENU_ELEMENTS_TREE_TOOLS,
  MENU_NAVIGATION_TREE_CREATE,
  TreeSelectionService,
} from '@cloudbeaver/plugin-navigation-tree';

import { ACTION_CONNECTION_CUSTOM } from './Actions/ACTION_CONNECTION_CUSTOM.js';
import { CustomConnectionSettingsService } from './CustomConnectionSettingsService.js';

const DriverSelectorDialog = importLazyComponent(() => import('./DriverSelector/DriverSelectorDialog.js').then(m => m.DriverSelectorDialog));

@injectable()
export class CustomConnectionPluginBootstrap extends Bootstrap {
  constructor(
    private readonly commonDialogService: CommonDialogService,
    private readonly projectInfoResource: ProjectInfoResource,
    private readonly menuService: MenuService,
    private readonly actionService: ActionService,
    private readonly connectionsManagerService: ConnectionsManagerService,
    private readonly customConnectionSettingsService: CustomConnectionSettingsService,
    private readonly treeSelectionService: TreeSelectionService,
  ) {
    super();
  }

  override register(): void | Promise<void> {
    this.menuService.addCreator({
      menus: [MENU_CONNECTIONS],
      getItems: (context, items) => [...items, ACTION_CONNECTION_CUSTOM],
    });

    // TODO: https://dbeaver.atlassian.net/browse/CB-6272
    // this.menuService.addCreator({
    //   menus: [MENU_ELEMENTS_TREE_TOOLS],
    //   isApplicable: context => {
    //     const tree = context.get(DATA_CONTEXT_ELEMENTS_TREE)!;

    //     return tree.baseRoot === ROOT_NODE_PATH;
    //   },
    //   getItems: (context, items) => {
    //     if (!items.includes(ACTION_TREE_CREATE_CONNECTION)) {
    //       return [...items, ACTION_TREE_CREATE_CONNECTION];
    //     }

    //     return items;
    //   },
    // });

    this.menuService.addCreator({
      contexts: [DATA_CONTEXT_NAV_NODE, DATA_CONTEXT_ELEMENTS_TREE],
      // TODO: https://dbeaver.atlassian.net/browse/CB-6272
      menus: [MENU_NAVIGATION_TREE_CREATE],
      // root: true,
      isApplicable: context => {
        const node = context.get(DATA_CONTEXT_NAV_NODE);
        const tree = context.get(DATA_CONTEXT_ELEMENTS_TREE)!;
        const targetNode = this.treeSelectionService.getFirstSelectedNode(
          tree,
          getProjectNodeId,
          project => project.canEditDataSources,
          isProjectNode,
          isConnectionFolder,
        );

        if (![isConnectionFolder, isProjectNode].some(check => check(node)) || this.isConnectionFeatureDisabled(true) || targetNode === undefined) {
          return false;
        }

        return true;
      },
      getItems: (context, items) => [...items, ACTION_TREE_CREATE_CONNECTION],
    });

    this.actionService.addHandler({
      id: 'nav-tree-create-create-connection-handler',
      actions: [ACTION_TREE_CREATE_CONNECTION],
      getActionInfo: (context, action) => {
        const menu = context.get(DATA_CONTEXT_MENU);
        if (menu === MENU_ELEMENTS_TREE_TOOLS) {
          return { ...action.info, icon: '/icons/add_sm.svg' };
        }
        return action.info;
      },
      getLoader: (context, action) => getCachedMapResourceLoaderState(this.projectInfoResource, () => CachedMapAllKey),
      handler: this.createConnectionHandler.bind(this),
    });

    this.actionService.addHandler({
      id: 'connection-custom',
      actions: [ACTION_CONNECTION_CUSTOM],
      isHidden: (context, action) => this.isConnectionFeatureDisabled(action === ACTION_CONNECTION_CUSTOM),
      getLoader: (context, action) => getCachedMapResourceLoaderState(this.projectInfoResource, () => CachedMapAllKey),
      handler: this.createConnectionHandler.bind(this),
    });
  }

  private async createConnectionHandler(context: IDataContextProvider, action: IAction) {
    switch (action) {
      case ACTION_TREE_CREATE_CONNECTION: {
        const tree = context.get(DATA_CONTEXT_ELEMENTS_TREE)!;
        const projectId = this.treeSelectionService.getSelectedProject(tree, isProjectNode)?.id;
        const selectedNode = this.treeSelectionService.getFirstSelectedNode(
          tree,
          getProjectNodeId,
          project => project.canEditDataSources,
          isProjectNode,
          isConnectionFolder,
        );
        const folderPath = selectedNode?.folderId ? getFolderPath(selectedNode.folderId) : undefined;
        await this.openConnectionsDialog(projectId, folderPath);
        break;
      }
      case ACTION_CONNECTION_CUSTOM:
        await this.openConnectionsDialog();
        break;
    }
  }

  private isConnectionFeatureDisabled(hasSettings: boolean) {
    if (this.connectionsManagerService.createConnectionProjects.length === 0) {
      return true;
    }

    if (hasSettings) {
      return this.customConnectionSettingsService.disabled;
    }

    return false;
  }

  private async openConnectionsDialog(projectId?: string, folderPath?: string) {
    await this.commonDialogService.open(DriverSelectorDialog, {
      projectId,
      folderPath,
    });
  }
}
