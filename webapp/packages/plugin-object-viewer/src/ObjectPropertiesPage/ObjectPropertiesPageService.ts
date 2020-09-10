/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import {
  NavNodeManagerService, ITab, INodeNavigationData
} from '@cloudbeaver/core-app';
import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { IContextProvider } from '@cloudbeaver/core-executor';

import { IObjectViewerTabState } from '../IObjectViewerTabState';
import { DBObjectPageService } from '../ObjectPage/DBObjectPageService';
import { ObjectPage } from '../ObjectPage/ObjectPage';
import { ObjectViewerTabService } from '../ObjectViewerTabService';
import { ObjectPropertiesPagePanel } from './ObjectPropertiesPagePanel';
import { ObjectPropertiesPageTab } from './ObjectPropertiesPageTab';

@injectable()
export class ObjectPropertiesPageService {
  page?: ObjectPage;

  constructor(
    private navNodeManagerService: NavNodeManagerService,
    private notificationService: NotificationService,
    private objectViewerTabService: ObjectViewerTabService,
    private dbObjectPageService: DBObjectPageService
  ) {
  }

  registerDBObjectPage(): void {
    this.page = this.dbObjectPageService.register({
      key: 'properties',
      priority: 1,
      order: 1,
      getTabComponent: () => ObjectPropertiesPageTab,
      getPanelComponent: () => ObjectPropertiesPagePanel,
      onSelect: this.handlePageSelect.bind(this),
    });
    this.navNodeManagerService.navigator.addHandler(this.navigationHandler.bind(this));
  }

  private async handlePageSelect(tab: ITab<IObjectViewerTabState>) {
    // TODO: must be loaded by info folder?
    // await this.nodesManagerService.loadDatabaseObjectInfo(tab.handlerState.objectId);
    // await this.nodesManagerService.loadNodeInfo(tab.handlerState.objectId);
  }

  private async navigationHandler(contexts: IContextProvider<INodeNavigationData>) {
    if (!this.page) { // TODO: it will be never true, because navHandler registers after page creation
      return;
    }

    try {
      const tabContext = await contexts.getContext(this.objectViewerTabService.objectViewerTabContext);

      if (tabContext.tab && !tabContext.tab.handlerState.folderId) {
        tabContext.tab.handlerState.folderId = 'infoTab';
      }

      tabContext.trySwitchPage(this.page);
    } catch (exception) {
      this.notificationService.logException(exception, 'Error in Object Viewer while processing action with database node');
    }
  }
}
