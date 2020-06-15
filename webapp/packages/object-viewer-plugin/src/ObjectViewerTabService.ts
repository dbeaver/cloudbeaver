/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import {
  NavigationTabsService,
  INodeNavigationData,
  IContextProvider,
  ITab,
  TabHandler,
  NavigationType,
  NodeManagerUtils,
  connectionProvider,
  objectCatalogProvider,
  objectSchemaProvider,
  NavNodeManagerService,
  DBObjectService,
  NavNode,
} from '@dbeaver/core/app';
import { injectable } from '@dbeaver/core/di';
import { NotificationService } from '@dbeaver/core/eventsLog';

import { IObjectViewerTabContext } from './IObjectViewerTabContext';
import { IObjectViewerTabState } from './IObjectViewerTabState';
import { DBObjectPageService } from './ObjectPage/DBObjectPageService';
import { ObjectPage } from './ObjectPage/ObjectPage';
import { ObjectViewerPanel } from './ObjectViewerPanel';
import { ObjectViewerTab } from './ObjectViewerTab';
import { objectViewerTabHandlerKey } from './objectViewerTabHandlerKey';

@injectable()
export class ObjectViewerTabService {
  readonly tabHandler: TabHandler<IObjectViewerTabState>

  constructor(
    private navNodeManagerService: NavNodeManagerService,
    private dbObjectService: DBObjectService,
    private dbObjectPageService: DBObjectPageService,
    private notificationService: NotificationService,
    private navigationTabsService: NavigationTabsService
  ) {

    this.tabHandler = this.navigationTabsService
      .registerTabHandler<IObjectViewerTabState>({
        key: objectViewerTabHandlerKey,
        getTabComponent: () => ObjectViewerTab,
        getPanelComponent: () => ObjectViewerPanel,
        onRestore: this.restoreObjectTab.bind(this),
        onSelect: this.selectObjectTab.bind(this),
        onClose: this.closeObjectTab.bind(this),

        extensions: [
          connectionProvider(this.getConnection.bind(this)),
          objectCatalogProvider(this.getDBObjectCatalog.bind(this)),
          objectSchemaProvider(this.getDBObjectSchema.bind(this)),
        ],
      });
  }

  registerTabHandler() {
    this.navNodeManagerService.navigator.addHandler(this.navigationHandler.bind(this));
    this.navNodeManagerService.navNode.onDataUpdate.subscribe(this.updateTabs.bind(this));
  }

  objectViewerTabContext = async (
    contexts: IContextProvider<INodeNavigationData>,
    data: INodeNavigationData
  ): Promise<IObjectViewerTabContext> => {
    const tabInfo = await contexts.getContext(this.navigationTabsService.navigationTabContext);
    const nodeInfo = await contexts.getContext(this.navNodeManagerService.navigationNavNodeContext);

    if (data.type !== NavigationType.closeConnection) {
    // check if tab already exist for object
      const tab = this.navigationTabsService.findTab(
        isObjectViewerTab(tab => tab.handlerState.objectId === nodeInfo.nodeId)
      );

      if (tab) {
        tab.handlerState.tabIcon = nodeInfo.icon;
        tab.handlerState.tabTitle = nodeInfo.name;
        tabInfo.registerTab(tab);
      } else {
        tabInfo.openNewTab<IObjectViewerTabState>({
          handlerId: objectViewerTabHandlerKey,
          handlerState: {
            objectId: nodeInfo.nodeId,
            parentId: nodeInfo.parentId,
            parents: await nodeInfo.getParents(),
            folderId: nodeInfo.folderId,
            pageId: '',
            pagesState: new Map(),
            tabIcon: nodeInfo.icon,
            tabTitle: nodeInfo.name,
          },
        });
      }
    }
    const getPage = () => {
      if (!tabInfo.tab) {
        return;
      }
      const pageId = (tabInfo.tab?.handlerState as IObjectViewerTabState | undefined)?.pageId;
      if (!pageId) {
        return;
      }
      return this.dbObjectPageService.getPage(pageId);
    };

    const trySwitchPage = (page: ObjectPage) => {
      if (!tabInfo.tab) {
        return false;
      }

      return this.dbObjectPageService.trySwitchPage(tabInfo.tab, page);
    };

    return {
      get tab() {
        return tabInfo.tab;
      },
      get page() {
        return getPage();
      },
      trySwitchPage,
      tabInfo,
      nodeInfo,
    };
  }

  private async updateTabs(data: Map<string, NavNode>) {
    for (const tab of this.navigationTabsService.findTabs(isObjectViewerTab(tab => tab.restored))) {
      if (!data.has(tab.handlerState.objectId)) {
        await this.navigationTabsService.closeTab(tab.id, true);
      } else if (tab.id === this.navigationTabsService.currentTabId) {
        const loaded = this.navNodeManagerService.navNode.isLoaded({
          nodes: [{ nodeId: tab.handlerState.objectId, parentId: tab.handlerState.parentId }],
        });
        const loading = this.navNodeManagerService.navNode.isDataLoading({
          nodes: [{ nodeId: tab.handlerState.objectId, parentId: tab.handlerState.parentId }],
        });

        if (!loaded && !loading) {
          await this.navigationTabsService.selectTab(tab.id);
        }
      }
    }
  }

  private getConnection(context: ITab<IObjectViewerTabState>) {
    const nodeInfo = this.navNodeManagerService
      .getNodeContainerInfo(context.handlerState.objectId);

    if (!nodeInfo.connectionId) {
      return;
    }
    // connection node id differs from connection id
    return NodeManagerUtils.connectionNodeIdToConnectionId(nodeInfo.connectionId);
  }

  private getDBObjectCatalog(context: ITab<IObjectViewerTabState>) {
    const nodeInfo = this.navNodeManagerService
      .getNodeContainerInfo(context.handlerState.objectId);

    if (!nodeInfo.catalogId) {
      return;
    }
    return nodeInfo.catalogId;
  }

  private getDBObjectSchema(context: ITab<IObjectViewerTabState>) {
    const nodeInfo = this.navNodeManagerService
      .getNodeContainerInfo(context.handlerState.objectId);

    if (!nodeInfo.schemaId) {
      return;
    }
    return nodeInfo.schemaId;
  }

  private async selectObjectTab(tab: ITab<IObjectViewerTabState>) {
    try {
      const currentPage = this.dbObjectPageService.getPage(tab.handlerState.pageId);
      if (currentPage) {
        await this.dbObjectPageService.selectPage(tab, currentPage);
      }

      // TODO: must be loaded by info folder?
      await this.navNodeManagerService.loadNode({
        nodeId: tab.handlerState.objectId,
        parentId: tab.handlerState.parentId,
      });
      const children = await this.navNodeManagerService.loadTree(tab.handlerState.objectId);
      await this.dbObjectService.load(tab.handlerState.objectId);

      const folderId = tab.handlerState.folderId;

      if (children.length === 0 || !NodeManagerUtils.isDatabaseObject(folderId)) {
        return;
      }
      const folderChildren = await this.navNodeManagerService.loadTree(folderId);

      await this.dbObjectService.load(folderChildren, folderId);
    } catch (exception) {
      this.notificationService.logException(exception, 'Error in Object Viewer while tab selecting');
    }
  }

  private async restoreObjectTab(tab: ITab<IObjectViewerTabState>) {
    if (
      typeof tab.handlerState?.folderId === 'string'
      && typeof tab.handlerState.parentId === 'string'
      && Array.isArray(tab.handlerState.parents)
      && typeof tab.handlerState.objectId === 'string'
      && (!tab.handlerState.tabIcon || typeof tab.handlerState.tabIcon === 'string')
      && (!tab.handlerState.tabTitle || typeof tab.handlerState.tabTitle === 'string')
    ) {
      for (const nodeId of tab.handlerState.parents) {
        await this.navNodeManagerService.loadTree(nodeId);
      }

      const node = await this.navNodeManagerService.loadNode({
        nodeId: tab.handlerState.objectId,
        parentId: tab.handlerState.parentId,
      });
      if (node) {
        tab.handlerState.tabIcon = node.icon;
        tab.handlerState.tabTitle = node.name;

        return this.dbObjectPageService.restorePages(tab);
      }
    }
    return false;
  }

  private async closeObjectTab(tab: ITab<IObjectViewerTabState>) {
    await this.dbObjectPageService.closePages(tab);
  }

  private async navigationHandler(contexts: IContextProvider<INodeNavigationData>) {
    try {
      const { tab, tabInfo, nodeInfo } = await contexts.getContext(this.objectViewerTabContext);

      if (nodeInfo.type === NavigationType.closeConnection) {
        for (const tab of this.navigationTabsService.findTabs(
          isObjectViewerTab(tab => tab.handlerState.objectId.includes(nodeInfo.nodeId))
        )) {
          await this.navigationTabsService.closeTab(tab.id);
        }
        return;
      }

      if (tab) {
        if (!tab.handlerState.folderId || (nodeInfo.folderId && tab.handlerState.folderId !== nodeInfo.folderId)) {
          tab.handlerState.folderId = nodeInfo.folderId;
        }
        this.navigationTabsService.selectTab(tab.id);
      }
    } catch (exception) {
      this.notificationService.logException(exception, 'Error in Object Viewer while processing action with database node');
    }
  }
}

export function isObjectViewerTab(tab: ITab): tab is ITab<IObjectViewerTabState>;
export function isObjectViewerTab(
  predicate: (tab: ITab<IObjectViewerTabState>) => boolean
): (tab: ITab) => tab is ITab<IObjectViewerTabState>
export function isObjectViewerTab(
  tab: ITab | ((tab: ITab<IObjectViewerTabState>) => boolean)
): boolean | ((tab: ITab) => tab is ITab<IObjectViewerTabState>) {
  if (typeof tab === 'function') {
    const predicate = tab;
    return (tab: ITab): tab is ITab<IObjectViewerTabState> => {
      const objectViewerTab = tab.handlerId === objectViewerTabHandlerKey;
      if (!predicate || !objectViewerTab) {
        return objectViewerTab;
      }
      return predicate(tab);
    };
  }
  return tab.handlerId === objectViewerTabHandlerKey;
}
