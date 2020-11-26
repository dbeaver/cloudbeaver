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
  DBObjectService
} from '@cloudbeaver/core-app';
import { connectionProvider, ConnectionInfoResource, Connection } from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { IExecutionContextProvider } from '@cloudbeaver/core-executor';
import { ResourceKey, resourceKeyList, ResourceKeyUtils } from '@cloudbeaver/core-sdk';

import { IObjectViewerTabContext } from './IObjectViewerTabContext';
import { IObjectViewerTabState } from './IObjectViewerTabState';
import { DBObjectPageService } from './ObjectPage/DBObjectPageService';
import { ObjectPage } from './ObjectPage/ObjectPage';
import { ObjectViewerPanel } from './ObjectViewerPanel';
import { ObjectViewerTab } from './ObjectViewerTab';
import { objectViewerTabHandlerKey } from './objectViewerTabHandlerKey';

@injectable()
export class ObjectViewerTabService {
  readonly tabHandler: TabHandler<IObjectViewerTabState>;

  constructor(
    private navNodeManagerService: NavNodeManagerService,
    private dbObjectService: DBObjectService,
    private dbObjectPageService: DBObjectPageService,
    private notificationService: NotificationService,
    private navigationTabsService: NavigationTabsService,
    private connectionInfo: ConnectionInfoResource
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
    this.connectionInfo.onConnectionClose.addHandler(this.closeConnectionInfoTabs.bind(this));
    this.connectionInfo.onItemAdd.addHandler(this.updateConnectionTabs.bind(this));
    this.navNodeManagerService.navNodeInfoResource.onItemAdd.addHandler(this.updateTabs.bind(this));
    this.navNodeManagerService.navNodeInfoResource.onItemDelete.addHandler(this.removeTabs.bind(this));
  }

  isPageActive(tab: ITab<IObjectViewerTabState>, page: ObjectPage): boolean {
    return tab.handlerState.pageId === page.key;
  }

  objectViewerTabContext = async (
    contexts: IExecutionContextProvider<INodeNavigationData>,
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
          connectionId: nodeInfo.connection?.id,
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
  };

  private async updateConnectionTabs(key: ResourceKey<string>) {
    await ResourceKeyUtils.forEachAsync(key, async key => {
      const tab = this.navigationTabsService.findTab(
        isObjectViewerTab(tab =>
          tab.id === this.navigationTabsService.currentTabId
          && tab.handlerState.connectionId === key
        )
      );

      if (tab) {
        await this.navigationTabsService.selectTab(tab.id);
      }
    });
  }

  private async closeConnectionInfoTabs(connection: Connection) {
    const navNodeId = NodeManagerUtils.connectionIdToConnectionNodeId(connection.id);

    if (!connection.connected) {
      const tab = this.navigationTabsService.findTab(
        isObjectViewerTab(tab => tab.handlerState.objectId === navNodeId)
      );

      if (tab) {
        await this.navigationTabsService.closeTab(tab.id, true);
      }
    }
  }

  private async updateTabs(key: ResourceKey<string>) {
    await ResourceKeyUtils.forEachAsync(key, async key => {
      const tab = this.navigationTabsService.findTab(
        isObjectViewerTab(tab =>
          tab.id === this.navigationTabsService.currentTabId
          && tab.handlerState.objectId === key
        )
      );

      if (tab) {
        await this.navigationTabsService.selectTab(tab.id);
      }
    });
  }

  private async removeTabs(key: ResourceKey<string>) {
    await ResourceKeyUtils.forEachAsync(key, async key => {
      const tab = this.navigationTabsService.findTab(
        isObjectViewerTab(tab => tab.handlerState.objectId === key)
      );

      if (tab) {
        await this.navigationTabsService.closeTab(tab.id, true);
      }
    });
  }

  private getConnection(context: ITab<IObjectViewerTabState>) {
    return context.handlerState.connectionId;
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
      if (tab.handlerState.connectionId) {
        const connection = await this.connectionInfo.load(tab.handlerState.connectionId);

        if (!connection.connected) {
          return;
        }
      }

      for (const nodeId of tab.handlerState.parents) {
        await this.navNodeManagerService.loadTree(nodeId);
      }

      // TODO: must be loaded by info folder?
      const node = await this.navNodeManagerService.loadNode({
        nodeId: tab.handlerState.objectId,
        parentId: tab.handlerState.parentId,
      });

      const currentPage = this.dbObjectPageService.getPage(tab.handlerState.pageId);

      if (currentPage) {
        await this.dbObjectPageService.selectPage(tab, currentPage);
      }

      if (node) {
        tab.handlerState.tabIcon = node.icon;
        tab.handlerState.tabTitle = node.name;
      }

      await this.dbObjectService.load(tab.handlerState.objectId);
      const children = await this.navNodeManagerService.loadTree(tab.handlerState.objectId);

      const folderId = tab.handlerState.folderId;

      if (children.length === 0 || !NodeManagerUtils.isDatabaseObject(folderId)) {
        return;
      }
      const folderChildren = await this.navNodeManagerService.loadTree(folderId);

      await this.dbObjectService.loadChildren(folderId, resourceKeyList(folderChildren));
    } catch (exception) {
      this.notificationService.logException(exception, 'Object Viewer Error', 'Error in Object Viewer while tab selecting');
    }
  }

  private async restoreObjectTab(tab: ITab<IObjectViewerTabState>) {
    if (
      typeof tab.handlerState?.folderId === 'string'
      && typeof tab.handlerState.parentId === 'string'
      && ['string', 'undefined'].includes(typeof tab.handlerState.connectionId)
      && Array.isArray(tab.handlerState.parents)
      && typeof tab.handlerState.objectId === 'string'
      && typeof tab.handlerState.pagesState === 'object'
      && (!tab.handlerState.tabIcon || typeof tab.handlerState.tabIcon === 'string')
      && (!tab.handlerState.tabTitle || typeof tab.handlerState.tabTitle === 'string')
    ) {
      tab.handlerState.pagesState = observable.map(tab.handlerState.pagesState);
      if (tab.handlerState.connectionId) {
        if (!this.connectionInfo.has(tab.handlerState.connectionId)) {
          return false;
        }
      }

      return this.dbObjectPageService.restorePages(tab);
    }
    return false;
  }

  private async closeObjectTab(tab: ITab<IObjectViewerTabState>) {
    await this.dbObjectPageService.closePages(tab);
  }

  private async navigationHandler(data: INodeNavigationData, contexts: IExecutionContextProvider<INodeNavigationData>) {
    try {
      const { tab, nodeInfo } = await contexts.getContext(this.objectViewerTabContext);

      if (tab) {
        if (!tab.handlerState.folderId || (nodeInfo.folderId && tab.handlerState.folderId !== nodeInfo.folderId)) {
          tab.handlerState.folderId = nodeInfo.folderId;
        }
        this.navigationTabsService.selectTab(tab.id);
      }
    } catch (exception) {
      this.notificationService.logException(exception, 'Object Viewer Error', 'Error in Object Viewer while processing action with database node');
    }
  }
}

export function isObjectViewerTab(tab: ITab): tab is ITab<IObjectViewerTabState>;
export function isObjectViewerTab(
  predicate: (tab: ITab<IObjectViewerTabState>) => boolean
): (tab: ITab) => tab is ITab<IObjectViewerTabState>;
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
