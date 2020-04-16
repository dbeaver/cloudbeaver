/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';

import { injectable } from '@dbeaver/core/di';
import { NotificationService } from '@dbeaver/core/eventsLog';

import { NodesManagerService } from '../shared/NodesManager/NodesManagerService';

@injectable()
export class NavigationTreeService {

  selectedNodes = observable.array<string>([]);

  constructor(private nodesManagerService: NodesManagerService,
              private notificationService: NotificationService) {
  }

  async loadNestedNodes(id = '/') {
    try {
      const children = await this.nodesManagerService.loadChildren(id);
      if (children) {
        return true;
      }
    } catch (exception) {
      this.notificationService.logException(exception, `Can't load tree node: ${id}`);
    }
    return false;
  }

  selectNode(id: string, isMultiple?: boolean) {
    if (!isMultiple) {
      this.selectedNodes.clear();
    }
    if (!this.selectedNodes.includes(id)) {
      this.selectedNodes.push(id);
      return true;
    }
    this.selectedNodes.remove(id);
    return false;
  }
}
