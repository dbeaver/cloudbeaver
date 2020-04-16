/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';

import {
  NodesManagerService,
  NavigationTabsService,
} from '@dbeaver/core/app';
import { injectable } from '@dbeaver/core/di';
import { NotificationService } from '@dbeaver/core/eventsLog';

import { objectViewerTabHandlerKey } from './objectViewerTabHandlerKey';

@injectable()
export class ObjectViewerService {
  @observable private propertiesTabLoadingState: Map<string, boolean> = new Map();

  constructor(private nodesManagerService: NodesManagerService,
              private notificationService: NotificationService,
              private navigationTabsService: NavigationTabsService) {
  }

  isTabLoading(id: string): boolean {
    return !this.propertiesTabLoadingState.get(id);
  }

  async selectObjectTab(nodeId: string, handlerId: string) {
    if (handlerId !== objectViewerTabHandlerKey) {
      return;
    }
    try {
      const tab = this.navigationTabsService.getTab(nodeId);
      if (tab) {
        await this.nodesManagerService.loadDatabaseObjectInfo(nodeId);
        const children = await this.nodesManagerService.loadChildren(nodeId);
        let childrenId = tab.getHandlerState<string>(handlerId)!;
        const propertiesTabLoadingKey = `${nodeId}_${childrenId}`;

        if (childrenId === '') {
          childrenId = 'infoTab';
          tab.updateHandlerState({
            handlerId: objectViewerTabHandlerKey,
            state: childrenId,
          });
        }

        if (children.length === 0) {
          this.propertiesTabLoadingState.set(propertiesTabLoadingKey, true);
          return;
        }

        this.propertiesTabLoadingState.set(propertiesTabLoadingKey, false);

        try {
          // todo temporary dirty hack before navigation system refactoring
          if (childrenId !== 'infoTab' && childrenId !== 'ddl-viewer') {
            await this.nodesManagerService.loadChildrenDatabaseObjectInfo(childrenId);
          }
        } finally {
          this.propertiesTabLoadingState.set(propertiesTabLoadingKey, true);
        }
      }
    } catch (exception) {
      this.notificationService.logException(exception, 'Error in Object Viewer while tab selecting');
    }
  }

  async restoreObjectTab(tabId: string, handlerId: string) {
    const tab = this.navigationTabsService.getTab(tabId);
    if (tab && tab.hasHandler(objectViewerTabHandlerKey)) {
      const node = await this.nodesManagerService.loadNodeInfo(tab.nodeId);
      if (node) {
        tab.icon = node.icon;
        tab.name = node.name;
        return true;
      }
    }
    return false;
  }
}
