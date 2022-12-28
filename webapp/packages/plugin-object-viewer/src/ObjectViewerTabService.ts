/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, makeObservable, runInAction } from 'mobx';

import { connectionProvider, ConnectionInfoResource, Connection, createConnectionParam, IConnectionInfoParams, ConnectionNavNodeService, objectCatalogProvider, objectSchemaProvider, ConnectionInfoActiveProjectKey } from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import type { IAsyncContextLoader, IExecutionContextProvider } from '@cloudbeaver/core-executor';
import { NavNodeManagerService, objectNavNodeProvider, type INodeNavigationData, NodeManagerUtils, NavigationType } from '@cloudbeaver/core-navigation-tree';
import { ResourceKey, resourceKeyList, ResourceKeyUtils } from '@cloudbeaver/core-sdk';
import { NavigationTabsService, ITab, TabHandler } from '@cloudbeaver/plugin-navigation-tabs';

import type { IObjectViewerTabContext } from './IObjectViewerTabContext';
import type { IObjectViewerTabState } from './IObjectViewerTabState';
import { DBObjectPageService } from './ObjectPage/DBObjectPageService';
import type { ObjectPage } from './ObjectPage/ObjectPage';
import { ObjectViewerPanel } from './ObjectViewerPanel';
import { ObjectViewerTab } from './ObjectViewerTab';
import { objectViewerTabHandlerKey } from './objectViewerTabHandlerKey';

@injectable()
export class ObjectViewerTabService {
  readonly tabHandler: TabHandler<IObjectViewerTabState>;

  constructor(
    private readonly navNodeManagerService: NavNodeManagerService,
    private readonly dbObjectPageService: DBObjectPageService,
    private readonly notificationService: NotificationService,
    private readonly navigationTabsService: NavigationTabsService,
    private readonly connectionInfoResource: ConnectionInfoResource,
    private readonly connectionNavNodeService: ConnectionNavNodeService,
  ) {
    this.tabHandler = this.navigationTabsService
      .registerTabHandler<IObjectViewerTabState>({
      key: objectViewerTabHandlerKey,
      getTabComponent: () => ObjectViewerTab,
      getPanelComponent: () => ObjectViewerPanel,
      onRestore: this.restoreObjectTab.bind(this),
      onSelect: this.selectObjectTab.bind(this),
      onClose: this.closeObjectTab.bind(this),
      canClose: this.canCloseObjectTab.bind(this),

      extensions: [
        objectNavNodeProvider(this.getNavNode.bind(this)),
        connectionProvider(this.getConnection.bind(this)),
        objectCatalogProvider(this.getDBObjectCatalog.bind(this)),
        objectSchemaProvider(this.getDBObjectSchema.bind(this)),
      ],
    });

    makeObservable<this, 'updateConnectionTabs' | 'selectObjectTab'>(this, {
      updateConnectionTabs: action,
      selectObjectTab: action,
    });
  }

  registerTabHandler(): void {
    this.navNodeManagerService.navigator.addHandler(this.navigationHandler.bind(this));
    this.navNodeManagerService.navigator.addPostHandler(this.navigationPostHandler.bind(this));
    this.connectionInfoResource.onConnectionClose.addHandler(this.closeConnectionInfoTabs.bind(this));
    this.connectionInfoResource.onItemAdd.addHandler(this.updateConnectionTabs.bind(this));
    this.connectionInfoResource.onItemDelete.addHandler(this.closeConnectionTabs.bind(this));
    this.navNodeManagerService.navTree.onItemDelete.addHandler(this.removeTabs.bind(this));
  }

  isPageActive(tab: ITab<IObjectViewerTabState>, page: ObjectPage): boolean {
    return tab.handlerState.pageId === page.key;
  }

  objectViewerTabContext: IAsyncContextLoader<IObjectViewerTabContext, INodeNavigationData> = async (
    contexts,
    data
  ) => {
    const tabInfo = contexts.getContext(this.navigationTabsService.navigationTabContext);
    const nodeInfo = contexts.getContext(this.navNodeManagerService.navigationNavNodeContext);
    const connection = await contexts.getContext(this.connectionNavNodeService.navigationNavNodeConnectionContext);

    // check if tab already exist for object
    const tab = this.navigationTabsService.findTab(
      isObjectViewerTab(tab => tab.handlerState.objectId === nodeInfo.nodeId)
    );

    if (tab) {
      tab.handlerState.tabIcon = nodeInfo.icon;
      tab.handlerState.tabTitle = nodeInfo.name;
      tabInfo.registerTab(tab);
    }

    function isSupported(): boolean {
      return NodeManagerUtils.isDatabaseObject(data.nodeId);
    }

    const initTab = (): ITab<IObjectViewerTabState> | null => {
      if (!tabInfo.tab && isSupported()) {
        tabInfo.openNewTab<IObjectViewerTabState>({
          projectId: nodeInfo.projectId ?? null,
          handlerId: objectViewerTabHandlerKey,
          handlerState: {
            projectId: nodeInfo.projectId,
            connectionKey: connection && createConnectionParam(connection),
            objectId: nodeInfo.nodeId,
            parentId: nodeInfo.parentId,
            parents: nodeInfo.getParents(),
            folderId: nodeInfo.folderId,
            pageId: '',
            childrenError: false,
            error: false,
            pagesState: {},
            tabIcon: nodeInfo.icon,
            tabTitle: nodeInfo.name,
          },
        });

        return tabInfo.tab;
      }

      return tabInfo.tab;
    };

    const getPage = () => {
      if (!tabInfo.tab) {
        return;
      }
      const pageId = (tabInfo.tab.handlerState as IObjectViewerTabState | undefined)?.pageId;
      if (!pageId) {
        return;
      }
      return this.dbObjectPageService.getPage(pageId);
    };

    let tabToSwitch: {
      page: ObjectPage<any> | undefined;
      state?: any;
    } = {
      page: getPage(),
    };

    const canSwitchPage = (
      page: ObjectPage<any>
    ) => !tabToSwitch.page || this.dbObjectPageService.canSwitchPage(tabToSwitch.page, page);

    const trySwitchPage = <T>(page: ObjectPage<T>, state?: T) => {
      if (!tabToSwitch.page || this.dbObjectPageService.canSwitchPage(tabToSwitch.page, page)) {
        tabToSwitch = {
          page,
          state,
        };
        return true;
      }

      return false;
    };

    const switchPage = <T>(page?: ObjectPage<T>, state?: T) => {
      if (!tabInfo.tab || (!page && !tabToSwitch.page)) {
        return false;
      }

      return this.dbObjectPageService.trySwitchPage(
        tabInfo.tab,
        page || tabToSwitch.page!,
        state || tabToSwitch.state
      );
    };

    const isPageActive = (page: ObjectPage) => page === getPage();

    return {
      get isSupported() {
        return isSupported();
      },
      get tab() {
        return tabInfo.tab;
      },
      get page() {
        return getPage();
      },
      tabInfo,
      nodeInfo,

      initTab,
      isPageActive,
      trySwitchPage,
      canSwitchPage,
      switchPage,
    };
  };

  private closeConnectionTabs(key: ResourceKey<IConnectionInfoParams>) {
    const tabs = Array.from(
      this.navigationTabsService.findTabs(
        isObjectViewerTab(tab => (
          tab.handlerState.connectionKey !== undefined
          && this.connectionInfoResource.includes(
            key,
            tab.handlerState.connectionKey
          )
        ))
      )
    )
      .map(tab => tab.id);

    this.navigationTabsService.closeTabSilent(resourceKeyList(tabs), true);
  }

  private updateConnectionTabs(key: ResourceKey<IConnectionInfoParams>) {
    ResourceKeyUtils.forEach(key, key => {
      const tab = this.navigationTabsService.findTab(
        isObjectViewerTab(tab =>
          tab.id === this.navigationTabsService.currentTabId
          && tab.handlerState.connectionKey !== undefined
          && this.connectionInfoResource.isKeyEqual(
            tab.handlerState.connectionKey,
            key
          )
        )
      );

      if (tab) {
        this.navigationTabsService.selectTab(tab.id);
      }
    });
  }

  private closeConnectionInfoTabs(connection: Connection) {
    if (!connection.connected) {
      const tabs = Array.from(this.navigationTabsService.findTabs(
        isObjectViewerTab(tab => (
          tab.handlerState.connectionKey?.projectId === connection.projectId
          && tab.handlerState.connectionKey.connectionId === connection.id
        ))
      )).map(tab => tab.id);

      this.navigationTabsService.closeTabSilent(resourceKeyList(tabs), true);
    }
  }

  private async removeTabs(key: ResourceKey<string>) {
    const tabs: string[] = [];

    await this.connectionInfoResource.load(ConnectionInfoActiveProjectKey);

    ResourceKeyUtils.forEach(key, key => {
      const tab = this.navigationTabsService.findTab(
        isObjectViewerTab(tab => tab.handlerState.objectId === key)
      );

      if (tab) {
        if (tab.handlerState.connectionKey) {
          const connection = this.connectionInfoResource.get(tab.handlerState.connectionKey);

          if (connection && !connection.connected) {
            return;
          }
        }

        tabs.push(tab.id);
      }
    });

    this.navigationTabsService.closeTabSilent(resourceKeyList(tabs), true);
  }

  private getNavNode({ handlerState }: ITab<IObjectViewerTabState>) {
    if (handlerState.connectionKey) {
      const connection = this.connectionInfoResource.get(handlerState.connectionKey);

      if (!connection?.connected) {
        return;
      }
    }

    return {
      nodeId: handlerState.objectId,
      path: handlerState.parents,
    };
  }

  private getConnection(context: ITab<IObjectViewerTabState>) {
    return context.handlerState.connectionKey;
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

  private selectObjectTab(tab: ITab<IObjectViewerTabState>) {
    if (tab.handlerState.error) {
      return;
    }

    try {
      const currentPage = this.dbObjectPageService.getPage(tab.handlerState.pageId);

      if (currentPage) {
        this.dbObjectPageService.selectPage(tab, currentPage);
      }

      if (tab.handlerState.childrenError) {
        return;
      }
    } catch (exception: any) {
      tab.handlerState.error = true;
      this.notificationService.logException(exception, 'Object Viewer Error', 'Error in Object Viewer while tab selecting');
    }
  }

  private async restoreObjectTab(tab: ITab<IObjectViewerTabState>) {
    if (
      typeof tab.handlerState.folderId === 'string'
      && typeof tab.handlerState.parentId === 'string'
      && ['object', 'undefined'].includes(typeof tab.handlerState.connectionKey)
      && ['string', 'undefined'].includes(typeof tab.handlerState.projectId)
      && Array.isArray(tab.handlerState.parents)
      && typeof tab.handlerState.objectId === 'string'
      && typeof tab.handlerState.pagesState === 'object'
      && typeof tab.handlerState.error === 'boolean'
      && typeof tab.handlerState.childrenError === 'boolean'
      && (!tab.handlerState.tabIcon || typeof tab.handlerState.tabIcon === 'string')
      && (!tab.handlerState.tabTitle || typeof tab.handlerState.tabTitle === 'string')
    ) {
      if (tab.handlerState.connectionKey) {
        await this.connectionInfoResource.load(ConnectionInfoActiveProjectKey);
        if (!this.connectionInfoResource.has(tab.handlerState.connectionKey)) {
          return false;
        }
      }

      runInAction(() => {
        tab.handlerState.error = false;
        tab.handlerState.childrenError = false;
      });

      return this.dbObjectPageService.restorePages(tab);
    }
    return false;
  }

  private async canCloseObjectTab(tab: ITab<IObjectViewerTabState>): Promise<boolean> {
    return await this.dbObjectPageService.canClosePages(tab);
  }

  private async closeObjectTab(tab: ITab<IObjectViewerTabState>) {
    await this.dbObjectPageService.closePages(tab);
  }

  private async navigationHandler(data: INodeNavigationData, contexts: IExecutionContextProvider<INodeNavigationData>) {
    try {
      const { isSupported, nodeInfo, initTab } = await contexts.getContext(this.objectViewerTabContext);

      if (isSupported) {
        nodeInfo.markOpen();
      }

      if (data.type !== NavigationType.open) {
        return;
      }

      const tab = initTab();

      if (tab) {
        runInAction(() => {
          if (
            !tab.handlerState.folderId
            || (data.folderId && tab.handlerState.folderId !== data.folderId)
            || (tab.handlerState.folderId !== nodeInfo.folderId)
          ) {
            tab.handlerState.childrenError = false;
            tab.handlerState.folderId = data.folderId || nodeInfo.folderId;
          }
          this.navigationTabsService.selectTab(tab.id);
        });
      }
    } catch (exception: any) {
      this.notificationService.logException(exception, 'Object Viewer Error', 'Error in Object Viewer while processing action with database node');
    }
  }

  private async navigationPostHandler(
    data: INodeNavigationData,
    contexts: IExecutionContextProvider<INodeNavigationData>
  ) {
    if (data.type !== NavigationType.open) {
      return;
    }

    if (!contexts.hasContext(this.objectViewerTabContext)) {
      return;
    }
    try {
      const { switchPage } = await contexts.getContext(this.objectViewerTabContext);

      switchPage();
    } catch (exception: any) {
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
