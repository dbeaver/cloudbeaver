/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, makeObservable, runInAction } from 'mobx';

import { importLazyComponent } from '@cloudbeaver/core-blocks';
import {
  ConnectionExecutionContextResource,
  ConnectionInfoActiveProjectKey,
  ConnectionInfoResource,
  connectionProvider,
  createConnectionParam,
  executionContextProvider,
  type IConnectionInfoParams,
  isConnectionInfoParamEqual,
  objectCatalogProvider,
  objectSchemaProvider,
} from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import type { IExecutionContextProvider, ISyncContextLoader } from '@cloudbeaver/core-executor';
import {
  type INavNodeRenameData,
  type INodeNavigationData,
  NavNodeManagerService,
  NavTreeResource,
  NodeManagerUtils,
  objectNavNodeProvider,
} from '@cloudbeaver/core-navigation-tree';
import { projectProvider } from '@cloudbeaver/core-projects';
import { type ResourceKey, resourceKeyList, type ResourceKeySimple, ResourceKeyUtils } from '@cloudbeaver/core-resource';
import { type ITab, NavigationTabsService, TabHandler } from '@cloudbeaver/plugin-navigation-tabs';
import { ConnectionNavNodeService } from '@cloudbeaver/plugin-connections';

import type { IObjectViewerTabContext } from './IObjectViewerTabContext.js';
import type { IObjectViewerTabState } from './IObjectViewerTabState.js';
import { DBObjectPageService } from './ObjectPage/DBObjectPageService.js';
import type { ObjectPage } from './ObjectPage/ObjectPage.js';
import { objectViewerTabHandlerKey } from './objectViewerTabHandlerKey.js';

const ObjectViewerPanel = importLazyComponent(() => import('./ObjectViewerPanel/ObjectViewerPanel.js').then(m => m.ObjectViewerPanel));
const ObjectViewerTab = importLazyComponent(() => import('./ObjectViewerTab.js').then(m => m.ObjectViewerTab));

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
    private readonly navTreeResource: NavTreeResource,
    private readonly connectionExecutionContextResource: ConnectionExecutionContextResource,
  ) {
    this.tabHandler = this.navigationTabsService.registerTabHandler<IObjectViewerTabState>({
      key: objectViewerTabHandlerKey,
      getTabComponent: () => ObjectViewerTab,
      getPanelComponent: () => ObjectViewerPanel,
      onRestore: this.restoreObjectTab.bind(this),
      onSelect: this.selectObjectTab.bind(this),
      onClose: this.closeObjectTab.bind(this),
      canClose: this.canCloseObjectTab.bind(this),

      extensions: [
        projectProvider(this.getProject.bind(this)),
        objectNavNodeProvider(this.getNavNode.bind(this)),
        connectionProvider(this.getConnection.bind(this)),
        objectCatalogProvider(this.getDBObjectCatalog.bind(this)),
        objectSchemaProvider(this.getDBObjectSchema.bind(this)),
        executionContextProvider(this.getExecutionContext.bind(this)),
      ],
    });

    makeObservable<this, 'updateConnectionTabs' | 'selectObjectTab'>(this, {
      updateConnectionTabs: action,
      selectObjectTab: action,
    });
  }

  registerTabHandler(): void {
    this.navNodeManagerService.onCanOpen.addHandler(this.canOpenHandler.bind(this));
    this.navNodeManagerService.navigator.addHandler(this.navigationHandler.bind(this));
    this.navNodeManagerService.navigator.addPostHandler(this.navigationPostHandler.bind(this));
    this.connectionInfoResource.onItemUpdate.addHandler(this.updateConnectionTabs.bind(this));
    this.connectionInfoResource.onItemDelete.addHandler(this.closeConnectionTabs.bind(this));
    this.navTreeResource.onItemDelete.addHandler(this.removeTabs.bind(this));
    this.navTreeResource.onNodeRename.addHandler(this.handleNodeRename.bind(this));
  }

  private handleNodeRename(data: INavNodeRenameData, contexts: IExecutionContextProvider<INavNodeRenameData>) {
    runInAction(() => {
      const context = contexts.getContext(this.objectViewerTabContext);

      if (context.tab) {
        context.tab.handlerState.objectId = data.newNodeId;
      }
    });
  }

  isPageActive(tab: ITab<IObjectViewerTabState>, page: ObjectPage): boolean {
    return tab.handlerState.pageId === page.key;
  }

  objectViewerTabContext: ISyncContextLoader<IObjectViewerTabContext, INodeNavigationData> = (contexts, data) => {
    const tabInfo = contexts.getContext(this.navigationTabsService.navigationTabContext);
    const nodeInfo = contexts.getContext(this.navNodeManagerService.navigationNavNodeContext);

    // check if tab already exist for object
    const tab = this.navigationTabsService.findTab(isObjectViewerTab(tab => tab.handlerState.objectId === nodeInfo.nodeId));

    if (tab) {
      runInAction(() => {
        tab.handlerState.tabIcon = nodeInfo.icon;
        tab.handlerState.tabTitle = nodeInfo.name;
      });
      tabInfo.registerTab(tab);
    }

    function isSupported(): boolean {
      return NodeManagerUtils.isDatabaseObject(data.nodeId);
    }

    if (isSupported()) {
      nodeInfo.markOpen();
    }

    const initTab = async (): Promise<ITab<IObjectViewerTabState> | null> => {
      if (!tabInfo.tab && isSupported()) {
        const connection = await contexts.getContext(this.connectionNavNodeService.navigationNavNodeConnectionContext);

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

    const canSwitchPage = (page: ObjectPage<any>) => !tabToSwitch.page || this.dbObjectPageService.canSwitchPage(tabToSwitch.page, page);

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

      return this.dbObjectPageService.trySwitchPage(tabInfo.tab, page || tabToSwitch.page!, state || tabToSwitch.state);
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

  private closeConnectionTabs(key: ResourceKeySimple<IConnectionInfoParams>) {
    const tabs = Array.from(
      this.navigationTabsService.findTabs(
        isObjectViewerTab(
          tab => tab.handlerState.connectionKey !== undefined && this.connectionInfoResource.isIntersect(key, tab.handlerState.connectionKey),
        ),
      ),
    ).map(tab => tab.id);

    this.navigationTabsService.closeTabSilent(resourceKeyList(tabs), true);
  }

  private updateConnectionTabs(key: ResourceKeySimple<IConnectionInfoParams>) {
    ResourceKeyUtils.forEach(key, key => {
      const tab = this.navigationTabsService.findTab(
        isObjectViewerTab(
          tab =>
            tab.id === this.navigationTabsService.currentTabId &&
            tab.handlerState.connectionKey !== undefined &&
            this.connectionInfoResource.isKeyEqual(tab.handlerState.connectionKey, key),
        ),
      );

      if (tab) {
        this.navigationTabsService.selectTab(tab.id);
      }
    });
  }

  // this method must be synchronous with nav-tree update
  private removeTabs(key: ResourceKey<string>) {
    const tabs: string[] = [];

    ResourceKeyUtils.forEach(key, key => {
      const tab = this.navigationTabsService.findTab(isObjectViewerTab(tab => tab.handlerState.objectId === key));

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

  private getProject({ handlerState }: ITab<IObjectViewerTabState>) {
    return handlerState.projectId;
  }

  private getNavNode({ handlerState }: ITab<IObjectViewerTabState>) {
    if (handlerState.connectionKey) {
      if (!this.connectionInfoResource.isConnected(handlerState.connectionKey)) {
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
    const nodeInfo = this.navNodeManagerService.getNodeContainerInfo(context.handlerState.objectId);

    if (!nodeInfo.catalogId) {
      return;
    }
    return nodeInfo.catalogId;
  }

  private getDBObjectSchema(context: ITab<IObjectViewerTabState>) {
    const nodeInfo = this.navNodeManagerService.getNodeContainerInfo(context.handlerState.objectId);

    if (!nodeInfo.schemaId) {
      return;
    }
    return nodeInfo.schemaId;
  }

  private getExecutionContext(context: ITab<IObjectViewerTabState>) {
    const connectionKey = context.handlerState.connectionKey;

    if (!connectionKey) {
      return;
    }

    return this.connectionExecutionContextResource.values.find(connection => isConnectionInfoParamEqual(connection, connectionKey));
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
      typeof tab.handlerState.folderId === 'string' &&
      ['string', 'undefined'].includes(typeof tab.handlerState.parentId) &&
      ['object', 'undefined'].includes(typeof tab.handlerState.connectionKey) &&
      ['string', 'undefined'].includes(typeof tab.handlerState.projectId) &&
      Array.isArray(tab.handlerState.parents) &&
      typeof tab.handlerState.objectId === 'string' &&
      typeof tab.handlerState.pagesState === 'object' &&
      typeof tab.handlerState.error === 'boolean' &&
      typeof tab.handlerState.childrenError === 'boolean' &&
      (!tab.handlerState.tabIcon || typeof tab.handlerState.tabIcon === 'string') &&
      (!tab.handlerState.tabTitle || typeof tab.handlerState.tabTitle === 'string')
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

  private canOpenHandler(data: INodeNavigationData, contexts: IExecutionContextProvider<INodeNavigationData>) {
    contexts.getContext(this.objectViewerTabContext); // mark can open
  }

  private async navigationHandler(data: INodeNavigationData, contexts: IExecutionContextProvider<INodeNavigationData>) {
    try {
      const { nodeInfo, initTab } = contexts.getContext(this.objectViewerTabContext);

      const tab = await initTab();

      if (tab) {
        runInAction(() => {
          if (
            !tab.handlerState.folderId ||
            (data.folderId && tab.handlerState.folderId !== data.folderId) ||
            tab.handlerState.folderId !== nodeInfo.folderId
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

  private navigationPostHandler(data: INodeNavigationData, contexts: IExecutionContextProvider<INodeNavigationData>) {
    if (!contexts.hasContext(this.objectViewerTabContext)) {
      return;
    }
    try {
      const { switchPage } = contexts.getContext(this.objectViewerTabContext);

      switchPage();
    } catch (exception: any) {
      this.notificationService.logException(exception, 'Object Viewer Error', 'Error in Object Viewer while processing action with database node');
    }
  }
}

export function isObjectViewerTab(tab: ITab): tab is ITab<IObjectViewerTabState>;
export function isObjectViewerTab(predicate: (tab: ITab<IObjectViewerTabState>) => boolean): (tab: ITab) => tab is ITab<IObjectViewerTabState>;
export function isObjectViewerTab(
  tab: ITab | ((tab: ITab<IObjectViewerTabState>) => boolean),
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
