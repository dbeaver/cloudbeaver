/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { NavigationTabsService } from '@cloudbeaver/core-app';
import { ConnectionsManagerService, IConnectionExecutorData } from '@cloudbeaver/core-connections';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { ExecutorInterrupter, IExecutionContextProvider } from '@cloudbeaver/core-executor';
import { DataViewerTabService } from '@cloudbeaver/plugin-data-viewer';

import { ObjectPropertiesPageService } from './ObjectPropertiesPage/ObjectPropertiesPageService';
import { isObjectViewerTab, ObjectViewerTabService } from './ObjectViewerTabService';

@injectable()
export class ObjectViewerBootstrap extends Bootstrap {
  constructor(
    private readonly objectViewerTabService: ObjectViewerTabService,
    private readonly objectPropertiesPageService: ObjectPropertiesPageService,
    private readonly connectionsManagerService: ConnectionsManagerService,
    private readonly navigationTabsService: NavigationTabsService,
    private readonly dataViewerTabService: DataViewerTabService
  ) {
    super();
  }

  register(): void {
    this.objectViewerTabService.registerTabHandler();
    this.objectPropertiesPageService.registerDBObjectPage();

    this.connectionsManagerService.onDisconnect.addHandler(this.disconnectHandler.bind(this));
  }

  load(): void { }

  private async disconnectHandler(
    data: IConnectionExecutorData,
    contexts: IExecutionContextProvider<IConnectionExecutorData>
  ) {
    if (data.state === 'before') {
      const tabs = Array.from(this.navigationTabsService.findTabs(
        isObjectViewerTab(tab => data.connections.includes(tab.handlerState.connectionId ?? ''))
      ));

      for (const tab of tabs) {
        const canClose = await this.dataViewerTabService.canClose(tab);

        if (!canClose) {
          ExecutorInterrupter.interrupt(contexts);
          return;
        }
      }
    }
  }
}
