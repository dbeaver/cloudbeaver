/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';
import { Subject, Observable } from 'rxjs';

import { ConnectionAuthService } from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { IActiveView } from '@cloudbeaver/core-view';

import { EObjectFeature } from '../shared/NodesManager/EObjectFeature';
import { NavNodeExtensionsService } from '../shared/NodesManager/NavNodeExtensionsService';
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
    private connectionAuthService: ConnectionAuthService,
    private navNodeExtensionsService: NavNodeExtensionsService
  ) {
    this.nodeSelectSubject = new Subject();
    this.onNodeSelect = this.nodeSelectSubject.asObservable();
    this.getView = this.getView.bind(this);
  }

  async navToNode(id: string, parentId: string) {
    await this.navNodeManagerService.navToNode(id, parentId);
  }

  async loadNestedNodes(id = ROOT_NODE_PATH) {
    try {
      if (this.isConnectionNode(id) && !await this.tryInitConnection(id)) {
        return false;
      }
      await this.navNodeManagerService.loadTree(id);
      return true;
    } catch (exception) {
      this.notificationService.logException(exception);
    }
    return false;
  }

  selectNode(id: string, multiple?: boolean): boolean {
    if (!multiple) {
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

  getView(): IActiveView<string> | null {
    const context = this.selectedNodes[0];
    if (!context) {
      return null;
    }

    return {
      context,
      extensions: this.navNodeExtensionsService.extensions,
    };
  }

  private isConnectionNode(navNodeId: string) {
    const node = this.navNodeManagerService.getNode(navNodeId);
    return node?.objectFeatures.includes(EObjectFeature.dataSource);
  }

  private async tryInitConnection(navNodeId: string) {
    const connection = await this.connectionAuthService.auth(
      NodeManagerUtils.connectionNodeIdToConnectionId(navNodeId));

    return connection.connected;
  }
}
