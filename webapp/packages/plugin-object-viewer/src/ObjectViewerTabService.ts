/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import {
  NavigationTabsService,
  INodeNavigationData,
  ITab,
  TabHandler,
  objectCatalogProvider,
  objectSchemaProvider,
  NavNodeManagerService
} from '@cloudbeaver/core-app';
import { connectionProvider, ConnectionInfoResource, Connection } from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import type { IAsyncContextLoader, IExecutionContextProvider } from '@cloudbeaver/core-executor';
import { CachedMapAllKey, ResourceKey, ResourceKeyUtils } from '@cloudbeaver/core-sdk';

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
    private navNodeManagerService: NavNodeManagerService,
    private dbObjectPageService: DBObjectPageService,
    private notificationService: NotificationService,
    private navigationTabsService: NavigationTabsService,
    private connectionInfo: ConnectionInfoResource,
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
        connectionProvider(this.getConnection.bind(this)),
        objectCatalogProvider(this.getDBObjectCatalog.bind(this)),
        objectSchemaProvider(this.getDBObjectSchema.bind(this)),
      ],
    });
  }

  registerTabHandler(): void {
    this.navNodeManagerService.navigator.addHandler(this.navigationHandler.bind(this));
    this.navNodeManagerService.navigator.addPostHandler(this.navigationPostHandler.bind(this));
    this.connectionInfo.onConnectionClose.addHandler(this.closeConnectionInfoTabs.bind(this));
    this.connectionInfo.onItemAdd.addHandler(this.updateConnectionTabs.bind(this));
    this.connectionInfo.onItemDelete.addHandler(this.closeConnectionTabs.bind(this));
    this.navNodeManagerService.navNodeInfoResource.onItemAdd.addHandler(this.updateTabs.bind(this));
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
      get tab() {
        return tabInfo.tab;
      },
      get page() {
        return getPage();
      },
      tabInfo,
      nodeInfo,
      isPageActive,
      trySwitchPage,
      canSwitchPage,
      switchPage,
    };
  };

  private async closeConnectionTabs(key: ResourceKey<string>) {
    await ResourceKeyUtils.forEachAsync(key, async key => {
      const tabs = this.navigationTabsService.findTabs(
        isObjectViewerTab(tab => tab.handlerState.connectionId === key)
      );

      for (const tab of tabs) {
        await this.navigationTabsService.closeTab(tab.id, true);
      }
    });
  }

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
    if (!connection.connected) {
      const tabs = this.navigationTabsService.findTabs(
        isObjectViewerTab(tab => tab.handlerState.connectionId === connection.id)
      );

      for (const tab of tabs) {
        await this.navigationTabsService.closeTab(tab.id, true);
      }
    }
  }

  private async updateTabs(key: ResourceKey<string>) {
    await ResourceKeyUtils.forEachAsync(key, async key => {
      const tab = this.navigationTabsService.findTab(
        isObjectViewerTab(tab => tab.handlerState.objectId === key)
      );

      if (tab) {
        tab.handlerState.error = false;

        if (tab.id === this.navigationTabsService.currentTabId) {
          await this.navigationTabsService.selectTab(tab.id);
        }
      }
    });
  }

  private async removeTabs(key: ResourceKey<string>) {
    await ResourceKeyUtils.forEachAsync(key, async key => {
      const tab = this.navigationTabsService.findTab(
        isObjectViewerTab(tab => tab.handlerState.objectId === key)
      );

      if (tab) {
        if (tab.handlerState.connectionId && this.connectionInfo.has(tab.handlerState.connectionId)) {
          const connection = await this.connectionInfo.load(tab.handlerState.connectionId);

          if (!connection.connected) {
            return;
          }
        }
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
    if (tab.handlerState.error) {
      return;
    }

    try {
      if (tab.handlerState.connectionId) {
        // here we wait when connections info will be updated and then check is connections is steel available
        await this.connectionInfo.waitLoad();

        if (!this.connectionInfo.has(tab.handlerState.connectionId)) {
          return;
        }

        const connection = await this.connectionInfo.load(tab.handlerState.connectionId);

        if (!connection.connected) {
          return;
        }
      }

      const currentPage = this.dbObjectPageService.getPage(tab.handlerState.pageId);

      if (currentPage) {
        await this.dbObjectPageService.selectPage(tab, currentPage);
      }

      if (tab.handlerState.childrenError) {
        return;
      }
    } catch (exception) {
      tab.handlerState.error = true;
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
      && typeof tab.handlerState.error === 'boolean'
      && typeof tab.handlerState.childrenError === 'boolean'
      && (!tab.handlerState.tabIcon || typeof tab.handlerState.tabIcon === 'string')
      && (!tab.handlerState.tabTitle || typeof tab.handlerState.tabTitle === 'string')
    ) {
      if (tab.handlerState.connectionId) {
        await this.connectionInfo.load(CachedMapAllKey);
        if (!this.connectionInfo.has(tab.handlerState.connectionId)) {
          return false;
        }
      }
      tab.handlerState.error = false;
      tab.handlerState.childrenError = false;

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
      const { tab, nodeInfo } = await contexts.getContext(this.objectViewerTabContext);

      if (tab) {
        if (
          !tab.handlerState.folderId
          || (data.folderId && tab.handlerState.folderId !== data.folderId)
          || (tab.handlerState.folderId !== nodeInfo.folderId)
        ) {
          tab.handlerState.childrenError = false;
          tab.handlerState.folderId = data.folderId || nodeInfo.folderId;
        }
        this.navigationTabsService.selectTab(tab.id);
      }
    } catch (exception) {
      this.notificationService.logException(exception, 'Object Viewer Error', 'Error in Object Viewer while processing action with database node');
    }
  }

  private async navigationPostHandler(
    data: INodeNavigationData,
    contexts: IExecutionContextProvider<INodeNavigationData>
  ) {
    if (!contexts.hasContext(this.objectViewerTabContext)) {
      return;
    }
    try {
      const { switchPage } = await contexts.getContext(this.objectViewerTabContext);

      switchPage();
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
