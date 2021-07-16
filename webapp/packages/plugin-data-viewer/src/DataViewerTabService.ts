/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { NavNodeManagerService, INodeNavigationData, ITab } from '@cloudbeaver/core-app';
import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';
import { DBObjectPageService, ObjectPage, ObjectViewerTabService, IObjectViewerTabState } from '@cloudbeaver/plugin-object-viewer';

import { DataPresentationService } from './DataPresentationService';
import { DataViewerPanel } from './DataViewerPage/DataViewerPanel';
import { DataViewerTab } from './DataViewerPage/DataViewerTab';
import { DataViewerTableService } from './DataViewerTableService';
import type { IDataViewerPageState } from './IDataViewerPageState';

@injectable()
export class DataViewerTabService {
  readonly page: ObjectPage<IDataViewerPageState>;

  constructor(
    private navNodeManagerService: NavNodeManagerService,
    private dataViewerTableService: DataViewerTableService,
    private objectViewerTabService: ObjectViewerTabService,
    private dbObjectPageService: DBObjectPageService,
    private notificationService: NotificationService,
    private dataPresentationService: DataPresentationService,
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

  private async navigationHandler(data: INodeNavigationData, contexts: IExecutionContextProvider<INodeNavigationData>) {
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
    } catch (exception) {
      this.notificationService.logException(exception, 'Data Viewer Error', 'Error in Data Viewer while processing action with database node');
    }
  }

  private async handleTabSelect(tab: ITab<IObjectViewerTabState>) {
    if (tab.handlerState.pageId !== this.page.key) {
      return;
    }

    if (!tab.handlerState.connectionId) {
      return;
    }

    const node = await this.navNodeManagerService.loadNode({
      nodeId: tab.handlerState.objectId,
      parentId: tab.handlerState.parentId,
    });

    if (!this.navNodeManagerService.isNodeHasData(node)) {
      return;
    }

    let model = this.dataViewerTableService.get(tab.handlerState.tableId || '');

    if (tab.handlerState.tableId && model && !model.source.executionContext?.context) {
      await this.dataViewerTableService.removeTableModel(tab.handlerState.tableId);
      model = undefined;
    }

    if (!model) {
      model = await this.dataViewerTableService.create(
        tab.handlerState.connectionId,
        tab.handlerState.objectId
      );
      tab.handlerState.tableId = model.id;

      const pageState = this.page.getState(tab);

      if (pageState) {
        const presentation = this.dataPresentationService.get(pageState?.presentationId);

        if (presentation?.dataFormat !== undefined) {
          model.setDataFormat(presentation.dataFormat);
        }
      }
    }

    // TODO: used for initial data fetch, but can repeat request each time data tab is selected,
    //       so probably should be refactored and managed by presentation
    if (model.source.error === null && model.source.results.length === 0) {
      model.requestData();
    }
  }

  private async handleTabRestore(tab: ITab<IObjectViewerTabState>) {
    return true;
  }

  private handleTabClose(tab: ITab<IObjectViewerTabState>) {
    if (tab.handlerState.tableId) {
      this.dataViewerTableService.removeTableModel(tab.handlerState.tableId);
    }
  }
}
