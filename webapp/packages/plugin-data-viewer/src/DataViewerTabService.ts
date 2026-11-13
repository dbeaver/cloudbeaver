/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { ConnectionInfoResource, ConnectionsManagerService, type IConnectionExecutorData } from '@cloudbeaver/core-connections';
import { Context, disposeService, Effect, Layer } from '@cloudbeaver/core-di';
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

export class DataViewerTabServiceImpl {
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
        trySwitchPage(this.page, {
          resultIndex: 0,
          presentationId: '',
          valuePresentationId: null,
          persistedState: {},
        });
      }
    } catch (exception: any) {
      this.notificationService.logException(exception, 'Data Editor Error', 'Error in Data Editor while processing action with database node');
    }
  }

  private handleTabRestore(tab: ITab<IObjectViewerTabState>) {
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

export type DataViewerTabService = DataViewerTabServiceImpl;

export class DataViewerTabServiceDI extends Context.Service<DataViewerTabServiceDI, DataViewerTabServiceImpl>()(
  '@cloudbeaver/plugin-data-viewer/DataViewerTabService#DataViewerTabService',
) {
  static readonly implementation = DataViewerTabServiceImpl;

  static readonly dependencies = () =>
    [
      NavNodeManagerService,
      ObjectViewerTabService,
      DBObjectPageService,
      NotificationService,
      ConnectionsManagerService,
      NavigationTabsService,
      ConnectionInfoResource,
      TableViewerStorageService,
    ] as const;
  static readonly make: Effect.Effect<
    DataViewerTabServiceImpl,
    never,
    | Context.Service.Identifier<typeof NavNodeManagerService>
    | Context.Service.Identifier<typeof ObjectViewerTabService>
    | Context.Service.Identifier<typeof DBObjectPageService>
    | Context.Service.Identifier<typeof NotificationService>
    | Context.Service.Identifier<typeof ConnectionsManagerService>
    | Context.Service.Identifier<typeof NavigationTabsService>
    | Context.Service.Identifier<typeof ConnectionInfoResource>
    | Context.Service.Identifier<typeof TableViewerStorageService>
  > = Effect.gen(function* makeDataViewerTabService() {
    const navNodeManagerService = yield* NavNodeManagerService;
    const objectViewerTabService = yield* ObjectViewerTabService;
    const dbObjectPageService = yield* DBObjectPageService;
    const notificationService = yield* NotificationService;
    const connectionsManagerService = yield* ConnectionsManagerService;
    const navigationTabsService = yield* NavigationTabsService;
    const connectionInfoResource = yield* ConnectionInfoResource;
    const tableViewerStorageService = yield* TableViewerStorageService;

    return new DataViewerTabServiceImpl(
      navNodeManagerService,
      objectViewerTabService,
      dbObjectPageService,
      notificationService,
      connectionsManagerService,
      navigationTabsService,
      connectionInfoResource,
      tableViewerStorageService,
    );
  });
  static readonly layer: Layer.Layer<
    DataViewerTabServiceDI,
    never,
    | Context.Service.Identifier<typeof NavNodeManagerService>
    | Context.Service.Identifier<typeof ObjectViewerTabService>
    | Context.Service.Identifier<typeof DBObjectPageService>
    | Context.Service.Identifier<typeof NotificationService>
    | Context.Service.Identifier<typeof ConnectionsManagerService>
    | Context.Service.Identifier<typeof NavigationTabsService>
    | Context.Service.Identifier<typeof ConnectionInfoResource>
    | Context.Service.Identifier<typeof TableViewerStorageService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const DataViewerTabService = DataViewerTabServiceDI;
