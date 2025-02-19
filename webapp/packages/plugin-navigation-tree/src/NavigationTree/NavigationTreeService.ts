/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, makeObservable } from 'mobx';

import {
  type Connection,
  ConnectionInfoResource,
  ConnectionsManagerService,
  type IConnectionInfoParams,
  NavNodeExtensionsService,
} from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import { Executor, type IExecutor, type ISyncExecutor, SyncExecutor } from '@cloudbeaver/core-executor';
import { EObjectFeature, NavNodeInfoResource, NavNodeManagerService, NavTreeResource, ROOT_NODE_PATH } from '@cloudbeaver/core-navigation-tree';
import {
  CACHED_RESOURCE_DEFAULT_PAGE_OFFSET,
  CachedResourceOffsetPageKey,
  CachedResourceOffsetPageTargetKey,
  type ResourceKey,
  resourceKeyList,
} from '@cloudbeaver/core-resource';
import { MetadataMap } from '@cloudbeaver/core-utils';
import { ACTION_COLLAPSE_ALL, ACTION_FILTER, type IActiveView, View } from '@cloudbeaver/core-view';

import type { ITreeNodeState } from './ElementsTree/useElementsTree.js';

export interface INavigationNodeSelectionData {
  id: ResourceKey<string>;
  selected: boolean[];
}

interface INavigationNodeShowData {
  id: string;
  path: string[];
}

@injectable()
export class NavigationTreeService extends View<string> {
  readonly treeState: MetadataMap<string, ITreeNodeState>;
  readonly nodeSelectionTask: ISyncExecutor<INavigationNodeSelectionData>;
  readonly showNodeExecutor: IExecutor<INavigationNodeShowData>;

  constructor(
    private readonly navNodeManagerService: NavNodeManagerService,
    private readonly connectionsManagerService: ConnectionsManagerService,
    private readonly connectionInfoResource: ConnectionInfoResource,
    private readonly navNodeExtensionsService: NavNodeExtensionsService,
    private readonly navNodeInfoResource: NavNodeInfoResource,
    private readonly navTreeResource: NavTreeResource,
  ) {
    super();

    this.treeState = new MetadataMap<string, ITreeNodeState>(() => ({
      showInFilter: false,
      expanded: false,
      selected: false,
    }));

    this.nodeSelectionTask = new SyncExecutor();
    this.showNodeExecutor = new Executor();
    this.getView = this.getView.bind(this);
    this.getChildren = this.getChildren.bind(this);
    this.loadNestedNodes = this.loadNestedNodes.bind(this);
    this.registerAction(ACTION_FILTER, ACTION_COLLAPSE_ALL);

    makeObservable<NavigationTreeService, 'unselectAll'>(this, {
      selectNode: action,
      unselectAll: action,
    });
  }

  getChildren(id: string): string[] | undefined {
    return this.navNodeManagerService.getTree(id);
  }

  async navToNode(id: string, parentId?: string): Promise<void> {
    await this.navNodeManagerService.navToNode(id, parentId);
  }

  async showNode(id: string, path: string[]): Promise<void> {
    await this.showNodeExecutor.execute({ id, path });
  }

  async loadNestedNodes(id = ROOT_NODE_PATH, tryConnect?: boolean): Promise<boolean> {
    if (this.isConnectionNode(id)) {
      const node = this.navNodeInfoResource.get(id);

      if (!node?.projectId) {
        return false;
      }

      const connectionParam = this.connectionInfoResource.getConnectionIdForNodeId(node.projectId, id);
      let connection: Connection | undefined;
      if (connectionParam) {
        connection = await this.connectionInfoResource.load(connectionParam);
      } else {
        return false;
      }

      if (!connection.connected) {
        if (!tryConnect) {
          return false;
        }

        const connected = await this.tryInitConnection(connectionParam);
        if (!connected) {
          return false;
        }
      }
    }

    if (tryConnect && this.navTreeResource.getException(id)) {
      this.navTreeResource.markOutdated(id);
    }

    const preloaded = await this.navTreeResource.preloadParents(id);

    if (!preloaded) {
      return false;
    }

    await this.navTreeResource.load(
      CachedResourceOffsetPageKey(CACHED_RESOURCE_DEFAULT_PAGE_OFFSET, this.navTreeResource.childrenLimit).setParent(
        CachedResourceOffsetPageTargetKey(id),
      ),
    );

    return true;
  }

  selectNode(id: string, multiple?: boolean): void {
    if (!multiple) {
      this.unselectAll();
    }

    const metadata = this.treeState.get(id);
    metadata.selected = !metadata.selected;

    this.nodeSelectionTask.execute({
      id,
      selected: [metadata.selected],
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

  unselectAll() {
    const list: string[] = [];

    for (const [id, metadata] of this.treeState) {
      metadata.selected = false;
      list.push(id);
    }

    this.nodeSelectionTask.execute({
      id: resourceKeyList(list),
      selected: list.map(() => false),
    });
  }

  private isConnectionNode(navNodeId: string) {
    const node = this.navNodeManagerService.getNode(navNodeId);
    return node?.objectFeatures.includes(EObjectFeature.dataSource);
  }

  private async tryInitConnection(connectionKey: IConnectionInfoParams): Promise<boolean> {
    const connection = await this.connectionsManagerService.requireConnection(connectionKey);

    return connection?.connected || false;
  }
}
