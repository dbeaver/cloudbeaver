/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';
import { Subject, Observable } from 'rxjs';

import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';

import { ConnectionAuthService } from '../shared/ConnectionsManager/ConnectionAuthService';
import { EObjectFeature } from '../shared/NodesManager/EObjectFeature';
import { ROOT_NODE_PATH } from '../shared/NodesManager/NavNodeInfoResource';
import { NavNodeManagerService } from '../shared/NodesManager/NavNodeManagerService';
import { NodeManagerUtils } from '../shared/NodesManager/NodeManagerUtils';

@injectable()
export class NavigationTreeService {
  readonly selectedNodes = observable.array<string>([]);
  readonly onNodeSelect: Observable<[string, boolean]>;

  private nodeSelectSubject: Subject<[string, boolean]>;

  constructor(
    private navNodeManagerService: NavNodeManagerService,
    private notificationService: NotificationService,
    private connectionAuthService: ConnectionAuthService
  ) {
    this.nodeSelectSubject = new Subject();
    this.onNodeSelect = this.nodeSelectSubject.asObservable();
  }

  async navToNode(id: string, parentId: string) {
    try {
      await this.ensureConnectionInit(id);
      await this.navNodeManagerService.navToNode(id, parentId);
    } catch (exception) {
      this.notificationService.logException(exception);
    }
  }

  async loadNestedNodes(id = ROOT_NODE_PATH) {
    try {
      await this.ensureConnectionInit(id);
      await this.navNodeManagerService.refreshTree(id);
      return true;
    } catch (exception) {
      this.notificationService.logException(exception);
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

  private async ensureConnectionInit(navNodeId: string) {
    const node = this.navNodeManagerService.getNode(navNodeId);

    if (node?.objectFeatures.includes(EObjectFeature.dataSource)) {
      await this.connectionAuthService.auth(NodeManagerUtils.connectionNodeIdToConnectionId(navNodeId));
    }
  }
}
