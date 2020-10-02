/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';

import {
  NavigationTabsService,
  INodeNavigationData,
  ITab,
  TabHandler,
  NodeManagerUtils,
  objectCatalogProvider,
  objectSchemaProvider,
  NavNodeManagerService,
  DBObjectService,
} from '@cloudbeaver/core-app';
import { connectionProvider, ConnectionInfoResource } from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { IContextProvider } from '@cloudbeaver/core-executor';
import { ResourceKey, resourceKeyList, isResourceKeyList } from '@cloudbeaver/core-sdk';

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
    private connectionInfoResource: ConnectionInfoResource,
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

  registerTabHandler(): void {
    this.navNodeManagerService.navigator.addHandler(this.navigationHandler.bind(this));
    this.connectionInfoResource.onItemAdd.subscribe(this.updateConnectionInfoTabs.bind(this));
    this.navNodeManagerService.navNodeInfoResource.onItemAdd.subscribe(this.updateTabs.bind(this));
    this.navNodeManagerService.navNodeInfoResource.onItemDelete.subscribe(this.removeTabs.bind(this));
  }

  isPageActive(tab:ITab<IObjectViewerTabState>, page: ObjectPage): boolean {
    return tab.handlerState.pageId === page.key;
  }

  objectViewerTabContext = async (
    contexts: IContextProvider<INodeNavigationData>,
    data: INodeNavigationData
  ): Promise<IObjectViewerTabContext> => {
    const tabInfo = await contexts.getContext(this.navigationTabsService.navigationTabContext);
    const nodeInfo = await contexts.getContext(this.navNodeManagerService.navigationNavNodeContext);

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

    const trySwitchPage = <T>(page: ObjectPage<T>, state?: T) => {
      if (!tabInfo.tab) {
        return false;
      }

      return this.dbObjectPageService.trySwitchPage(tabInfo.tab, page, state);
    };

    const isPageActive = (page: ObjectPage) => page === getPage();

    return {
      get tab() {
        return tabInfo.tab;
      },
      get page() {
        return getPage();
      },
      isPageActive,
      trySwitchPage,
      tabInfo,
      nodeInfo,
    };
  }

  private async updateConnectionInfoTabs(key: ResourceKey<string>) {
    if (isResourceKeyList(key)) {
      for (const connectionId of key.list) {
        const navNodeId = NodeManagerUtils.connectionIdToConnectionNodeId(connectionId);
        const connected = this.connectionInfoResource.get(connectionId)?.connected;

        if (!connected) {
          const tab = this.navigationTabsService.findTab(
            isObjectViewerTab(tab => tab.handlerState.objectId === navNodeId)
          );

          if (tab) {
            await this.navigationTabsService.closeTab(tab.id, true);
          }
        }
      }
    } else {
      const navNodeId = NodeManagerUtils.connectionIdToConnectionNodeId(key);
      const connected = this.connectionInfoResource.get(key)?.connected;

      if (!connected) {
        const tab = this.navigationTabsService.findTab(
          isObjectViewerTab(tab => tab.handlerState.objectId === navNodeId)
        );

        if (tab) {
          await this.navigationTabsService.closeTab(tab.id, true);
        }
      }
    }
  }

  private async updateTabs(key: ResourceKey<string>) {
    if (isResourceKeyList(key)) {
      for (const objectId of key.list) {
        const tab = this.navigationTabsService.findTab(
          isObjectViewerTab(tab => tab.handlerState.objectId === objectId)
        );

        if (tab && tab.restored && this.navigationTabsService.currentTabId === tab.id) {
          await this.navigationTabsService.selectTab(tab.id);
        }
      }
    } else {
      const tab = this.navigationTabsService.findTab(
        isObjectViewerTab(tab => tab.handlerState.objectId === key)
      );

      if (tab && tab.restored && this.navigationTabsService.currentTabId === tab.id) {
        await this.navigationTabsService.selectTab(tab.id);
      }
    }
  }

  private async removeTabs(key: ResourceKey<string>) {
    if (isResourceKeyList(key)) {
      for (const objectId of key.list) {
        const tab = this.navigationTabsService.findTab(
          isObjectViewerTab(tab => tab.handlerState.objectId === objectId)
        );

        if (tab) {
          await this.navigationTabsService.closeTab(tab.id, true);
        }
      }
    } else {
      const tab = this.navigationTabsService.findTab(
        isObjectViewerTab(tab => tab.handlerState.objectId === key)
      );

      if (tab) {
        await this.navigationTabsService.closeTab(tab.id, true);
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
      await this.dbObjectService.load(tab.handlerState.objectId);
      const children = await this.navNodeManagerService.loadTree(tab.handlerState.objectId);

      const folderId = tab.handlerState.folderId;

      if (children.length === 0 || !NodeManagerUtils.isDatabaseObject(folderId)) {
        return;
      }
      const folderChildren = await this.navNodeManagerService.loadTree(folderId);

      await this.dbObjectService.loadChildren(folderId, resourceKeyList(folderChildren));
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
      && typeof tab.handlerState.pagesState === 'object'
      && (!tab.handlerState.tabIcon || typeof tab.handlerState.tabIcon === 'string')
      && (!tab.handlerState.tabTitle || typeof tab.handlerState.tabTitle === 'string')
    ) {
      tab.handlerState.pagesState = observable.map(tab.handlerState.pagesState);

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
