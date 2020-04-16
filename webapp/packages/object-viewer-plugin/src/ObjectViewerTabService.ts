/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import {
  NodesManagerService,
  NavigationTabsService,
  TabHandlerOptions,
  INodeNavigationData,
  IContextProvider,
} from '@dbeaver/core/app';
import { injectable } from '@dbeaver/core/di';
import { NotificationService } from '@dbeaver/core/eventsLog';

import { ObjectViewerService } from './ObjectViewerService';
import { objectViewerTabHandlerKey } from './objectViewerTabHandlerKey';
import { Viewer } from './Viewer';

@injectable()
export class ObjectViewerTabService {
  readonly tabHandler!: TabHandlerOptions

  constructor(private nodesManagerService: NodesManagerService,
              private objectViewerService: ObjectViewerService,
              private notificationService: NotificationService,
              private navigationTabsService: NavigationTabsService) {

    this.tabHandler = {
      key: objectViewerTabHandlerKey,
      name: 'Properties',
      icon: '/icons/properties.png',
      navigatorId: 'database',
      order: 1,
      priority: 1,
      getTabHandlerComponent: () => Viewer,
      isActive: id => /^database:\/\//.test(id),
      onRestore: this.objectViewerService.restoreObjectTab.bind(this.objectViewerService),
      onSelect: this.objectViewerService.selectObjectTab.bind(this.objectViewerService),
    };
  }

  registerTabHandler() {
    this.navigationTabsService.registerTabHandler(this.tabHandler);
    this.nodesManagerService.navigator.addHandler(this.navigationHandler.bind(this));
  }

  private async navigationHandler(contexts: IContextProvider<INodeNavigationData>) {
    try {
      const tabInfo = await contexts.getContext(this.navigationTabsService.navigationTabContext);
      const nodeInfo = await contexts.getContext(this.nodesManagerService.navigationNodeContext);
      const tab = this.navigationTabsService.getTab(nodeInfo.nodeId);

      if (tab) {
        const state = tab.getHandlerState(objectViewerTabHandlerKey);
        if (!state || nodeInfo.childrenId !== state) {
          tab.updateHandlerState({
            handlerId: objectViewerTabHandlerKey,
            state: nodeInfo.childrenId,
          });
        }
      } else {
        tabInfo.openNewTab({
          nodeId: nodeInfo.nodeId,
          handlerId: objectViewerTabHandlerKey,
          handlerState: new Map([[
            objectViewerTabHandlerKey,
            {
              handlerId: objectViewerTabHandlerKey,
              state: nodeInfo.childrenId,
            },
          ]]),
          name: nodeInfo.name,
          icon: nodeInfo.icon,
        });
        tabInfo.trySwitchHandler(this.tabHandler);
        return;
      }

      this.navigationTabsService.selectTab(nodeInfo.nodeId);
      tabInfo.trySwitchHandler(this.tabHandler);
    } catch (exception) {
      this.notificationService.logException(exception, 'Error in Object Viewer while processing action with database node');
    }
  }
}
