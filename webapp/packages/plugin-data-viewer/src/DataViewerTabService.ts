/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { ConnectionInfoResource, ConnectionsManagerService, type IConnectionExecutorData } from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { ExecutorInterrupter, type IExecutionContextProvider } from '@cloudbeaver/core-executor';
import { type INodeNavigationData, NavNodeManagerService } from '@cloudbeaver/core-navigation-tree';
import { resourceKeyList } from '@cloudbeaver/core-resource';
import { type ITab, NavigationTabsService } from '@cloudbeaver/plugin-navigation-tabs';
import {
  DBObjectPageService,
  type IObjectViewerTabState,
  isObjectViewerTab,
  ObjectPage,
  ObjectViewerTabService,
} from '@cloudbeaver/plugin-object-viewer';

import type { IDataViewerPageState } from './IDataViewerPageState.js';
import { TableViewerStorageService } from './TableViewer/TableViewerStorageService.js';

const DataViewerTab = importLazyComponent(() => import('./DataViewerPage/DataViewerTab.js').then(module => module.DataViewerTab));
const DataViewerPanel = importLazyComponent(() => import('./DataViewerPage/DataViewerPanel.js').then(module => module.DataViewerPanel));

@injectable()
export class DataViewerTabService {
  readonly page: ObjectPage<IDataViewerPageState>;

  constructor(
    private readonly navNodeManagerService: NavNodeManagerService,
    private readonly objectViewerTabService: ObjectViewerTabService,
    private readonly dbObjectPageService: DBObjectPageService,
    private readonly notificationService: NotificationService,
    private readonly connectionsManagerService: ConnectionsManagerService,
    private readonly navigationTabsService: NavigationTabsService,
    private readonly connectionInfoResource: ConnectionInfoResource,
    private readonly tableViewerStorageService: TableViewerStorageService,
  ) {
    this.page = this.dbObjectPageService.register({
      key: 'data_viewer_data',
      priority: 2,
      order: 2,
      getTabComponent: () => DataViewerTab,
      getPanelComponent: () => DataViewerPanel,
      onRestore: this.handleTabRestore.bind(this),
      onUnload: this.handleTabClose.bind(this),
      canClose: this.handleTabCanClose.bind(this),
      onClose: this.handleTabClose.bind(this),
    });
  }

  register() {
    this.connectionsManagerService.onDisconnect.addHandler(this.disconnectHandler.bind(this));
  }

  registerTabHandler(): void {
    this.navNodeManagerService.navigator.addHandler(this.navigationHandler.bind(this));
  }

  private async disconnectHandler(data: IConnectionExecutorData, contexts: IExecutionContextProvider<IConnectionExecutorData>) {
    const connectionsKey = resourceKeyList(data.connections);
    const tabs = Array.from(
      this.navigationTabsService.findTabs(
        isObjectViewerTab(tab => {
          if (!tab.handlerState.connectionKey) {
            return false;
          }
          return this.connectionInfoResource.isIntersect(connectionsKey, tab.handlerState.connectionKey);
        }),
      ),
    );

    for (const tab of tabs) {
      if (data.state === 'before') {
        const canDisconnect = await this.handleTabCanClose(tab);

        if (!canDisconnect) {
          ExecutorInterrupter.interrupt(contexts);
          return;
        }
      } else if (isObjectViewerTab(tab) && tab.handlerState.tableId) {
        await this.disposeTableModel(tab.handlerState.tableId);
      }
    }
  }

  private async navigationHandler(data: INodeNavigationData, contexts: IExecutionContextProvider<INodeNavigationData>) {
    try {
      const { nodeInfo, tabInfo, initTab, trySwitchPage } = contexts.getContext(this.objectViewerTabService.objectViewerTabContext);

      const node = await this.navNodeManagerService.loadNode(nodeInfo);

      if (!this.navNodeManagerService.isNodeHasData(node)) {
        return;
      }

      await initTab();

      if (tabInfo.isNewlyCreated) {
        trySwitchPage(this.page);
      }
    } catch (exception: any) {
      this.notificationService.logException(exception, 'Data Viewer Error', 'Error in Data Viewer while processing action with database node');
    }
  }

  private async handleTabRestore(tab: ITab<IObjectViewerTabState>) {
    return true;
  }

  private async handleTabCanClose(tab: ITab<IObjectViewerTabState>): Promise<boolean> {
    const model = this.tableViewerStorageService.get(tab.handlerState.tableId || '');

    if (model) {
      return await model.source.canSafelyDispose();
    }

    return true;
  }

  private async handleTabClose(tab: ITab<IObjectViewerTabState>) {
    if (tab.handlerState.tableId) {
      await this.disposeTableModel(tab.handlerState.tableId);
    }
  }

  private async disposeTableModel(tableId: string) {
    if (tableId) {
      const model = this.tableViewerStorageService.get(tableId);

      if (model) {
        await model.dispose();
        this.tableViewerStorageService.remove(tableId);
      }
    }
  }
}
