/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import {
  NavigationTabsService,
  NodesManagerService,
  TabHandlerOptions,
  INodeNavigationData,
  IContextProvider,
} from '@dbeaver/core/app';
import { injectable } from '@dbeaver/core/di';
import { NotificationService } from '@dbeaver/core/eventsLog';

import { dataViewerHandlerKey } from './dataViewerHandlerKey';
import { DataViewer } from './DataViewerTab/DataViewer';
import { DataViewerTableService } from './DataViewerTableService';

@injectable()
export class DataViewerTabService {

  private tabHandler: TabHandlerOptions = {
    key: dataViewerHandlerKey,
    name: 'Data',
    icon: '/icons/grid.png',
    navigatorId: 'database',
    order: 2,
    priority: 2,
    getTabHandlerComponent: () => DataViewer,
    onSelect: this.handleTabSelect.bind(this),
    onRestore: this.handleTabRestore.bind(this),
    onClose: this.handleTabClose.bind(this),
    isActive: this.isTabActive.bind(this), // executed in Tab rendering pipeline
  };

  constructor(private nodesManagerService: NodesManagerService,
              private dataViewerTableService: DataViewerTableService,
              private navigationTabsService: NavigationTabsService,
              private notificationService: NotificationService) {
  }

  registerTabHandler() {
    this.navigationTabsService.registerTabHandler(this.tabHandler);
    this.nodesManagerService.navigator.addHandler(this.navigationHandler.bind(this));
  }

  isTabActive(tabId: string) {
    return this.nodesManagerService.isNodeHasData(tabId);
  }

  private async navigationHandler(contexts: IContextProvider<INodeNavigationData>) {
    try {
      const tabInfo = await contexts.getContext(this.navigationTabsService.navigationTabContext);
      const nodeInfo = await contexts.getContext(this.nodesManagerService.navigationNodeContext);
      const objectInfo = await this.nodesManagerService.loadDatabaseObjectInfo(nodeInfo.nodeId);

      if (!this.nodesManagerService.isNodeHasData(objectInfo)) {
        return;
      }

      const tab = this.navigationTabsService.getTab(nodeInfo.nodeId);

      if (tab) {
        if (!tab.hasHandler(dataViewerHandlerKey)) {
          tab.updateHandlerState({
            handlerId: dataViewerHandlerKey,
            state: null,
          });
        }
      } else {
        tabInfo.openNewTab({
          nodeId: nodeInfo.nodeId,
          handlerId: dataViewerHandlerKey,
          handlerState: new Map([[
            dataViewerHandlerKey,
            {
              handlerId: dataViewerHandlerKey,
              state: null,
            },
          ]]),
          name: nodeInfo.name,
          icon: nodeInfo.icon,
        });
        tabInfo.trySwitchHandler(this.tabHandler); // todo it is wrong place to call it
        return;
      }

      this.navigationTabsService.selectTab(nodeInfo.nodeId);
      if (nodeInfo.childrenId === '') {
        tabInfo.trySwitchHandler(this.tabHandler);
      }
    } catch (exception) {
      this.notificationService.logException(exception, 'Error in Data Viewer while processing action with database node');
    }
  }

  private handleTabSelect(tableId: string, handlerId: string) {
    if (handlerId !== dataViewerHandlerKey) {
      return;
    }
    this.dataViewerTableService.createTableModelIfNotExists(tableId);
  }

  private async handleTabRestore(tabId: string, handlerId: string) {
    const tab = this.navigationTabsService.getTab(tabId);
    if (tab && tab.hasHandler(dataViewerHandlerKey)) {
      const info = await this.nodesManagerService.loadDatabaseObjectInfo(tabId);
      if (info) {
        return true;
      }
    }
    return false;
  }

  private handleTabClose(tableId: string) {
    this.dataViewerTableService.removeTableModel(tableId);
  }
}
