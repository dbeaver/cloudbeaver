/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import {
  Connection, ConnectionInfoResource, ConnectionsManagerService
} from '@cloudbeaver/core-connections';
import { injectable, Bootstrap } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { IExecutor, Executor, IExecutionContextProvider } from '@cloudbeaver/core-executor';
import {
  PermissionsService, EPermission, ServerService
} from '@cloudbeaver/core-root';
import { CachedMapAllKey, resourceKeyList } from '@cloudbeaver/core-sdk';
import { NavigationService } from '@cloudbeaver/core-ui';

import { ENodeFeature } from './ENodeFeature';
import type { NavNodeInfo, NavNode } from './EntityTypes';
import { EObjectFeature } from './EObjectFeature';
import { NavNodeInfoResource, ROOT_NODE_PATH } from './NavNodeInfoResource';
import { NavTreeResource } from './NavTreeResource';
import { NodeManagerUtils } from './NodeManagerUtils';

export enum NavigationType {
  open,
}

export interface NavNodeKey {
  nodeId: string;
  parentId: string;
}

export interface NavNodeValue {
  node: NavNodeInfo;
  parentId?: string;
}

export interface INodeContainerInfo {
  connectionId?: string;
  catalogId?: string;
  schemaId?: string;
}

export interface INavNodePath {
  nodes: NavNodeKey[];
  remove?: boolean;
  navNodeId?: never;
  nodesValue?: never;
}

export interface INavNodeData {
  nodesValue: NavNodeValue[];
  navNodeId?: never;
  nodes?: never;
  remove?: never;
}

export interface INavNodeId {
  navNodeId: string[];
  remove?: boolean;
  nodes?: never;
  nodesValue?: never;
}

export interface INodeNavigationContext {
  type: NavigationType;
  connection: Connection | undefined;
  nodeId: string;
  parentId: string;
  folderId: string;
  name?: string;
  icon?: string;
  getParents: () => string[];
  loadParents: (parents: string[]) => Promise<void>;
}

export interface INodeNavigationData {
  type: NavigationType;
  nodeId: string;
  parentId: string;
  folderId?: string;
}

@injectable()
export class NavNodeManagerService extends Bootstrap {
  readonly navigator: IExecutor<INodeNavigationData>;

  constructor(
    private readonly permissionsService: PermissionsService,
    readonly connectionInfo: ConnectionInfoResource,
    readonly navTree: NavTreeResource,
    readonly navNodeInfoResource: NavNodeInfoResource,
    private readonly connectionsManagerService: ConnectionsManagerService,
    private readonly notificationService: NotificationService,
    private readonly serverService: ServerService,
    navigationService: NavigationService
  ) {
    super();
    this.navigator = new Executor(
      {
        type: NavigationType.open,
        nodeId: ROOT_NODE_PATH,
        parentId: ROOT_NODE_PATH,
      },
      (active, current) => active.nodeId === current.nodeId
    )
      .before(navigationService.navigationTask)
      .addHandler(this.navigateHandler.bind(this));
  }

  register(): void { }

  load(): void { }

  async navToNode(nodeId: string, parentId: string, folderId?: string): Promise<void> {
    await this.navigator.execute({
      type: NavigationType.open,
      nodeId,
      parentId,
      folderId,
    });
  }

  async refreshTree(navNodeId: string): Promise<void> {
    await this.navTree.refreshTree(navNodeId);
  }

  getTree(navNodeId: string): string[] | undefined;
  getTree(navNodeKey: NavNodeKey): string[] | undefined;
  getTree(navNodeKey: NavNodeKey[]): Array<string[] | undefined>;
  getTree(navNodeId: string | NavNodeKey | NavNodeKey[]): string[] | undefined | Array<string[] | undefined> {
    if (typeof navNodeId === 'string') {
      return this.navTree.get(navNodeId);
    }

    if (Array.isArray(navNodeId)) {
      return navNodeId.map(node => this.navTree.data.get(node.nodeId));
    }

    return this.navTree.get(navNodeId.nodeId);
  }

  loadTree(navNodeId: string): Promise<string[]> {
    return this.navTree.load(navNodeId);
  }

  removeTree(path = ROOT_NODE_PATH): void {
    this.navTree.delete(path);
  }

  getNode(navNodeId: string): NavNode | undefined;
  getNode(navNodeKey: NavNodeKey): NavNode | undefined;
  getNode(navNodeKey: NavNodeKey[]): Array<NavNode | undefined>;
  getNode(navNodeId: string | NavNodeKey | NavNodeKey[]): NavNode | undefined | Array<NavNode | undefined> {
    if (typeof navNodeId === 'string') {
      return this.navNodeInfoResource.get(navNodeId);
    }

    if (Array.isArray(navNodeId)) {
      return navNodeId.map(node => this.navNodeInfoResource.get(node.nodeId));
    }

    return this.navNodeInfoResource.get(navNodeId.nodeId);
  }

  async loadNode(node: NavNodeKey): Promise<NavNode>;
  async loadNode(...nodes: NavNodeKey[]): Promise<NavNode>;
  async loadNode(...nodes: NavNodeKey[]): Promise<NavNode | NavNode[]> {
    const items = await this.navNodeInfoResource.load(resourceKeyList(nodes.map(n => n.nodeId)));

    for (let i = 0; i < items.length; i++) {
      items[i].parentId = nodes[i].parentId;
    }

    if (nodes.length === 1) {
      return this.getNode(nodes[0])!;
    }

    return this.getNode(nodes) as NavNode[];
  }

  removeNode(navNodeId = ROOT_NODE_PATH): void {
    this.navNodeInfoResource.delete(navNodeId);
  }

  getParent(node: NavNode): NavNode | undefined {
    return this.navNodeInfoResource.get(node.parentId);
  }

  isNodeHasData(node?: string | NavNode): boolean {
    if (typeof node === 'string') {
      node = this.getNode(node);
    }

    if (!node || !node.objectFeatures) {
      return false;
    }

    return node.objectFeatures.includes(ENodeFeature.dataContainer)
      || node.objectFeatures.includes(ENodeFeature.container);
  }

  async getNodeDatabaseAlias(nodeId: string): Promise<string> {
    const node = this.getNode(nodeId);

    if (node?.fullName) {
      return node.fullName;
    }

    const nodeInfo = await this.navNodeInfoResource.loadNodeFullName(nodeId);

    return nodeInfo.fullName!;
  }

  getNodeContainerInfo(nodeId: string): INodeContainerInfo {
    const initial: INodeContainerInfo = {};

    const scanParents = (res: INodeContainerInfo,
      nodeId?: string): INodeContainerInfo => {
      if (!nodeId) {
        return res;
      }
      const object = this.getNode(nodeId);
      if (!object) {
        return res;
      }
      if (object.objectFeatures.includes(EObjectFeature.dataSource)) {
        res.connectionId = object.id;
      }
      if (object.objectFeatures.includes(EObjectFeature.catalog)) {
        res.catalogId = object.name; // note that catalogId is node name
      }
      if (object.objectFeatures.includes(EObjectFeature.schema)) {
        res.schemaId = object.name; // note that schemaId is node name
      }
      return scanParents(res, object.parentId);
    };

    return scanParents(initial, nodeId);
  }

  navigationNavNodeContext = async (
    contexts: IExecutionContextProvider<INodeNavigationData>,
    data: INodeNavigationData
  ): Promise<INodeNavigationContext> => {
    let nodeId = data.nodeId;
    let parentId = data.parentId;
    let folderId = '';
    let name: string | undefined;
    let icon: string | undefined;

    await this.connectionInfo.load(CachedMapAllKey);

    const connection = this.connectionInfo.getConnectionForNode(nodeId);

    if (NodeManagerUtils.isDatabaseObject(nodeId) && connection?.connected) {
      const node = await this.loadNode({ nodeId, parentId });

      name = node.name;
      icon = node.icon;

      if (node.folder) {
        const parent = this.getNode(node.parentId);
        folderId = nodeId;
        if (parent && !parent.folder) {
          nodeId = parent.id;
          parentId = parent.parentId;
          name = parent.name;
          icon = parent.icon;
        }
      }

      if (data.folderId) {
        folderId = data.folderId;
      }
    }

    const getParents = () => {
      const parents: string[] = [];
      let parent = this.getNode(nodeId);

      if (!parent) {
        return NodeManagerUtils.parentsFromPath(nodeId);
      }

      while (parent && parent.id !== parent.parentId) {
        parents.unshift(parent.parentId);
        parent = this.getNode(parent.parentId);
      }

      return parents;
    };

    const loadParents = async (parents: string[]) => {
      let parentId = ROOT_NODE_PATH;

      const nodes = await this.navNodeInfoResource.load(resourceKeyList(parents));

      for (const node of nodes) {
        node.parentId = parentId;
        parentId = node.id;
      }
    };

    return {
      type: data.type,
      connection,
      nodeId,
      parentId,
      folderId,
      name,
      icon,
      getParents,
      loadParents,
    };
  };

  private async navigateHandler(
    data: INodeNavigationData,
    contexts: IExecutionContextProvider<INodeNavigationData>
    // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  ): Promise<void> {
    const nodeInfo = await contexts.getContext(this.navigationNavNodeContext);

    if (NodeManagerUtils.isDatabaseObject(nodeInfo.nodeId) && nodeInfo.connection) {
      const connection = await this.connectionsManagerService.requireConnection(nodeInfo.connection.id);

      if (!connection?.connected) {
        throw new Error('Connection not established');
      }
    }
  }

  private async isNavTreeEnabled() {
    const active = await this.permissionsService.hasAsync(EPermission.public);
    if (!active) {
      return false;
    }

    // TODO: IT'S IS REALLY BAD PLACE FOR THAT
    const config = await this.serverService.config.load();
    if (config?.configurationMode) {
      return false;
    }

    return true;
  }
}

export function parseNodeParentId(nodeId: string): string {
  const parentId = nodeId.slice(0, nodeId.lastIndexOf('/'));

  if (parentId === 'database:/') {
    return ROOT_NODE_PATH;
  }

  return parentId;
}
