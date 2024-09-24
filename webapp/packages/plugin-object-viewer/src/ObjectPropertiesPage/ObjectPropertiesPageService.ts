/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';
import { type INodeNavigationData, NavNodeManagerService } from '@cloudbeaver/core-navigation-tree';

import { DBObjectPageService } from '../ObjectPage/DBObjectPageService.js';
import type { ObjectPage } from '../ObjectPage/ObjectPage.js';
import { ObjectViewerTabService } from '../ObjectViewerTabService.js';
import { ObjectPropertiesPagePanel } from './ObjectPropertiesPagePanel.js';
import { ObjectPropertiesPageTab } from './ObjectPropertiesPageTab.js';

@injectable()
export class ObjectPropertiesPageService {
  page?: ObjectPage;

  constructor(
    private readonly navNodeManagerService: NavNodeManagerService,
    private readonly notificationService: NotificationService,
    private readonly objectViewerTabService: ObjectViewerTabService,
    private readonly dbObjectPageService: DBObjectPageService,
  ) {}

  registerDBObjectPage(): void {
    this.page = this.dbObjectPageService.register({
      key: 'properties',
      priority: 1,
      order: 1,
      getTabComponent: () => ObjectPropertiesPageTab,
      getPanelComponent: () => ObjectPropertiesPagePanel,
    });
    this.navNodeManagerService.navigator.addHandler(this.navigationHandler.bind(this));
  }

  private async navigationHandler(data: INodeNavigationData, contexts: IExecutionContextProvider<INodeNavigationData>) {
    if (!this.page) {
      // TODO: it will be never true, because navHandler registers after page creation
      return;
    }

    try {
      const tabContext = contexts.getContext(this.objectViewerTabService.objectViewerTabContext);

      await tabContext.initTab();
      tabContext.trySwitchPage(this.page);
    } catch (exception: any) {
      this.notificationService.logException(exception, 'Object Viewer Error', 'Error in Object Viewer while processing action with database node');
    }
  }
}
