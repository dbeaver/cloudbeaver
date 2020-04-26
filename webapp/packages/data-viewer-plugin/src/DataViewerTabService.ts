/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import {
  NodesManagerService,
  INodeNavigationData,
  IContextProvider,
  ITab,
  NavigationType,
} from '@dbeaver/core/app';
import { injectable } from '@dbeaver/core/di';
import { NotificationService } from '@dbeaver/core/eventsLog';
import {
  DBObjectPageService, ObjectPage, ObjectViewerTabService, IObjectViewerTabState
} from '@dbeaver/object-viewer-plugin';

import { dataViewerHandlerKey } from './dataViewerHandlerKey';
import { DataViewerPanel } from './DataViewerPage/DataViewerPanel';
import { DataViewerTab } from './DataViewerPage/DataViewerTab';
import { DataViewerTableService } from './DataViewerTableService';

@injectable()
export class DataViewerTabService {
  page: ObjectPage;

  constructor(private nodesManagerService: NodesManagerService,
              private dataViewerTableService: DataViewerTableService,
              private objectViewerTabService: ObjectViewerTabService,
              private dbObjectPageService: DBObjectPageService,
              private notificationService: NotificationService) {

    this.page = this.dbObjectPageService.register({
      key: dataViewerHandlerKey,
      navigatorId: 'database',
      priority: 2,
      order: 2,
      getTabComponent: () => DataViewerTab,
      getPanelComponent: () => DataViewerPanel,
      onSelect: this.handleTabSelect.bind(this),
      onRestore: this.handleTabRestore.bind(this),
      onClose: this.handleTabClose.bind(this),
    });
  }

  registerTabHandler() {
    this.nodesManagerService.navigator.addHandler(this.navigationHandler.bind(this));
  }

  private async navigationHandler(contexts: IContextProvider<INodeNavigationData>) {
    try {
      const {
        nodeInfo,
        tabInfo,
        trySwitchPage,
      } = await contexts.getContext(this.objectViewerTabService.objectViewerTabContext);


      if (nodeInfo.type === NavigationType.closeConnection) {
        return;
      }
      // const tabInfo = await contexts.getContext(this.navigationTabsService.navigationTabContext);
      const objectInfo = await this.nodesManagerService.loadDatabaseObjectInfo(nodeInfo.nodeId);

      if (!this.nodesManagerService.isNodeHasData(objectInfo)) {
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
    const objectInfo = await this.nodesManagerService.loadDatabaseObjectInfo(tab.handlerState.objectId);

    if (!this.nodesManagerService.isNodeHasData(objectInfo)) {
      return;
    }
    this.dataViewerTableService.createTableModelIfNotExists(tab.handlerState.objectId);
  }

  private async handleTabRestore(tab: ITab<IObjectViewerTabState>) {
    // if (!this.nodesManagerService.isNodeHasData(tab.handlerState.objectId)) {
    //   return;
    // }
    const info = await this.nodesManagerService.loadDatabaseObjectInfo(tab.handlerState.objectId);
    if (info) {
      return true;
    }
    return false;
  }

  private handleTabClose(tab: ITab<IObjectViewerTabState>) {
    this.dataViewerTableService.removeTableModel(tab.handlerState.objectId);
  }
}
