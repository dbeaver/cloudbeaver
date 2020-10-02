/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import {
  NavNodeManagerService,
  INodeNavigationData,
  ITab,
  NodeManagerUtils,
} from '@cloudbeaver/core-app';
import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { IContextProvider } from '@cloudbeaver/core-executor';
import {
  DBObjectPageService, ObjectPage, ObjectViewerTabService, IObjectViewerTabState
} from '@cloudbeaver/plugin-object-viewer';

import { DataViewerPanel } from './DataViewerPage/DataViewerPanel';
import { DataViewerTab } from './DataViewerPage/DataViewerTab';
import { DataViewerTableService } from './DataViewerTableService';
import { IDataViewerPageState } from './IDataViewerPageState';

@injectable()
export class DataViewerTabService {
  page: ObjectPage<IDataViewerPageState>;

  constructor(
    private navNodeManagerService: NavNodeManagerService,
    private dataViewerTableService: DataViewerTableService,
    private objectViewerTabService: ObjectViewerTabService,
    private dbObjectPageService: DBObjectPageService,
    private notificationService: NotificationService
  ) {

    this.page = this.dbObjectPageService.register({
      key: 'data_viewer_data',
      priority: 2,
      order: 2,
      getTabComponent: () => DataViewerTab,
      getPanelComponent: () => DataViewerPanel,
      onSelect: this.handleTabSelect.bind(this),
      onRestore: this.handleTabRestore.bind(this),
      onClose: this.handleTabClose.bind(this),
    });
  }

  registerTabHandler(): void {
    this.navNodeManagerService.navigator.addHandler(this.navigationHandler.bind(this));
  }

  private async navigationHandler(contexts: IContextProvider<INodeNavigationData>) {
    try {
      const {
        nodeInfo,
        tabInfo,
        trySwitchPage,
      } = await contexts.getContext(this.objectViewerTabService.objectViewerTabContext);

      const node = await this.navNodeManagerService.loadNode(nodeInfo);

      if (!this.navNodeManagerService.isNodeHasData(node)) {
        return;
      }

      if (tabInfo.isNewlyCreated) {
        trySwitchPage(this.page);
      }
      // if (nodeInfo.childrenId === '') {
      //   tabInfo.trySwitchHandler(this.tabHandler);
      // }
    } catch (exception) {
      this.notificationService.logException(exception, 'Error in Data Viewer while processing action with database node');
    }
  }

  private async handleTabSelect(tab: ITab<IObjectViewerTabState>) {
    const node = await this.navNodeManagerService.loadNode({
      nodeId: tab.handlerState.objectId,
      parentId: tab.handlerState.parentId,
    });

    if (!this.navNodeManagerService.isNodeHasData(node)) {
      return;
    }

    if (this.dataViewerTableService.has(tab.id)) {
      return;
    }

    const nodeInfo = this.navNodeManagerService
      .getNodeContainerInfo(tab.handlerState.objectId);

    if (!nodeInfo.connectionId) {
      return;
    }

    await this.dataViewerTableService.create(
      tab.id,
      NodeManagerUtils.connectionNodeIdToConnectionId(nodeInfo.connectionId),
      tab.handlerState.objectId
    );
  }

  private async handleTabRestore(tab: ITab<IObjectViewerTabState>) {
    // if (!this.nodesManagerService.isNodeHasData(tab.handlerState.objectId)) {
    //   return;
    // }
    await this.navNodeManagerService.loadNode({
      nodeId: tab.handlerState.objectId,
      parentId: tab.handlerState.parentId,
    });
    // await this.dbObjectService.load(tab.handlerState.objectId);
    return true;
  }

  private handleTabClose(tab: ITab<IObjectViewerTabState>) {
    this.dataViewerTableService.removeTableModel(tab.handlerState.objectId);
  }
}
