/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, makeObservable } from 'mobx';

import { ConnectionAuthService, ConnectionInfoResource } from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { Executor, IExecutor } from '@cloudbeaver/core-executor';
import { MetadataMap } from '@cloudbeaver/core-utils';
import type { IActiveView } from '@cloudbeaver/core-view';

import { EObjectFeature } from '../shared/NodesManager/EObjectFeature';
import { NavNodeExtensionsService } from '../shared/NodesManager/NavNodeExtensionsService';
import { ROOT_NODE_PATH } from '../shared/NodesManager/NavNodeInfoResource';
import { NavNodeManagerService } from '../shared/NodesManager/NavNodeManagerService';
import { NavTreeResource } from '../shared/NodesManager/NavTreeResource';
import { NodeManagerUtils } from '../shared/NodesManager/NodeManagerUtils';
import type { ITreeNodeState } from './useElementsTree';

export interface INavigationNodeSelectionData {
  id: string;
  selected: boolean;
}

@injectable()
export class NavigationTreeService {
  readonly treeState: MetadataMap<string, ITreeNodeState>;
  readonly nodeSelectionTask: IExecutor<INavigationNodeSelectionData>;

  constructor(
    private navNodeManagerService: NavNodeManagerService,
    private notificationService: NotificationService,
    private connectionAuthService: ConnectionAuthService,
    private connectionInfoResource: ConnectionInfoResource,
    private navNodeExtensionsService: NavNodeExtensionsService,
    private navTreeResource: NavTreeResource
  ) {
    makeObservable<NavigationTreeService, 'unselectAll'>(this, {
      unselectAll: action,
    });
    this.treeState = new MetadataMap(() => ({
      filter: '',
      expanded: false,
      selected: false,
    }));

    this.nodeSelectionTask = new Executor();
    this.getView = this.getView.bind(this);
  }

  getChildren(id: string): string[] | undefined {
    return this.navTreeResource.get(id);
  }

  async navToNode(id: string, parentId: string): Promise<void> {
    await this.navNodeManagerService.navToNode(id, parentId);
  }

  async loadNestedNodes(id = ROOT_NODE_PATH, tryConnect?: boolean): Promise<boolean> {
    try {
      if (this.isConnectionNode(id)) {
        const connection = await this.connectionInfoResource.load(
          NodeManagerUtils.connectionNodeIdToConnectionId(id)
        );

        if (!connection.connected && !tryConnect) {
          return false;
        }

        const connected = await this.tryInitConnection(id);

        if (!connected) {
          return false;
        }
      }
      await this.navTreeResource.load(id);
      return true;
    } catch (exception) {
      this.notificationService.logException(exception);
    }
    return false;
  }

  async selectNode(id: string, multiple?: boolean): Promise<void> {
    if (!multiple) {
      await this.unselectAll();
    }

    const metadata = this.treeState.get(id);
    metadata.selected = !metadata.selected;

    await this.nodeSelectionTask.execute({
      id,
      selected: metadata.selected,
    });
  }

  isNodeExpanded(navNodeId: string): boolean {
    return this.treeState.get(navNodeId).expanded;
  }

  isNodeSelected(navNodeId: string): boolean {
    return this.treeState.get(navNodeId).selected;
  }

  expandNode(navNodeId: string, state: boolean): void {
    const metadata = this.treeState.get(navNodeId);
    metadata.expanded = state;
  }

  getView(): IActiveView<string> | null {
    const element = Array.from(this.treeState).find(([key, metadata]) => metadata.selected);

    if (!element) {
      return null;
    }

    return {
      context: element[0],
      extensions: this.navNodeExtensionsService.extensions,
    };
  }

  private async unselectAll() {
    for (const [id, metadata] of this.treeState) {
      metadata.selected = false;
      await this.nodeSelectionTask.execute({
        id,
        selected: false,
      });
    }
  }

  private isConnectionNode(navNodeId: string) {
    const node = this.navNodeManagerService.getNode(navNodeId);
    return node?.objectFeatures.includes(EObjectFeature.dataSource);
  }

  private async tryInitConnection(navNodeId: string): Promise<boolean> {
    const connection = await this.connectionAuthService.auth(
      NodeManagerUtils.connectionNodeIdToConnectionId(navNodeId)
    );

    return connection?.connected || false;
  }
}
