/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';
import { Subject, Observable } from 'rxjs';

import { injectable } from '@dbeaver/core/di';
import { NotificationService } from '@dbeaver/core/eventsLog';

import { NavNodeManagerService, ROOT_NODE_PATH } from '../shared/NodesManager/NavNodeManagerService';

@injectable()
export class NavigationTreeService {
  readonly selectedNodes = observable.array<string>([]);
  readonly onNodeSelect: Observable<[string, boolean]>;

  private nodeSelectSubject: Subject<[string, boolean]>;

  constructor(
    private NavNodeManagerService: NavNodeManagerService,
    private notificationService: NotificationService
  ) {
    this.nodeSelectSubject = new Subject();
    this.onNodeSelect = this.nodeSelectSubject.asObservable();
  }

  async loadNestedNodes(id = ROOT_NODE_PATH) {
    try {
      await this.NavNodeManagerService.loadTree(id);
      return true;
    } catch (exception) {
      this.notificationService.logException(exception, `Can't load tree node: ${id}`);
    }
    return false;
  }

  selectNode(id: string, isMultiple?: boolean) {
    if (!isMultiple) {
      for (const id of this.selectedNodes) {
        this.nodeSelectSubject.next([id, false]);
      }
      this.selectedNodes.clear();
    }
    if (!this.isNodeSelected(id)) {
      this.selectedNodes.push(id);
      this.nodeSelectSubject.next([id, true]);
      return true;
    }
    this.selectedNodes.remove(id);
    this.nodeSelectSubject.next([id, false]);
    return false;
  }

  isNodeSelected(navNodeId: string) {
    return this.selectedNodes.includes(navNodeId);
  }
}
