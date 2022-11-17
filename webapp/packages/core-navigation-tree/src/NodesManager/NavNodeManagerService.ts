/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { makeObservable, observable } from 'mobx';

import { injectable, Bootstrap } from '@cloudbeaver/core-di';
import { IExecutor, Executor, IExecutionContextProvider, ISyncContextLoader } from '@cloudbeaver/core-executor';
import { resourceKeyList } from '@cloudbeaver/core-sdk';
import { NavigationService } from '@cloudbeaver/core-ui';
import type { IDataContextProvider } from '@cloudbeaver/core-view';

import { ENodeFeature } from './ENodeFeature';
import type { NavNodeInfo, NavNode } from './EntityTypes';
import { EObjectFeature } from './EObjectFeature';
import { NavNodeInfoResource, ROOT_NODE_PATH } from './NavNodeInfoResource';
import { navNodeMoveContext } from './navNodeMoveContext';
import { NavTreeResource } from './NavTreeResource';
import { NodeManagerUtils } from './NodeManagerUtils';
import { ProjectsNavNodeService } from './ProjectsNavNodeService';

export enum NavigationType {
  open,
  canOpen
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
  projectId: string | undefined;
  nodeId: string;
  parentId: string;
  folderId: string;
  name?: string;
  icon?: string;
  canOpen: boolean;

  markOpen(): void;
  getParents: () => string[];
  loadParents: (parents: string[]) => Promise<void>;
}

export interface INodeNavigationData {
  type: NavigationType;
  projectId?: string;
  nodeId: string;
  parentId: string;
  folderId?: string;
}

export enum ENodeMoveType {
  CanDrop,
  Drop
}

export interface INodeMoveData {
  type: ENodeMoveType;
  targetNode: NavNode;
  moveContexts: IDataContextProvider;
}

export interface INavNodeCache {
  canOpen: boolean;
  canMove: boolean;
}


@injectable()
export class NavNodeManagerService extends Bootstrap {
  readonly syncNodeInfoCache: Map<string, INavNodeCache>;

  readonly navigator: IExecutor<INodeNavigationData>;
  readonly onMove: IExecutor<INodeMoveData>;

  constructor(
    readonly navTree: NavTreeResource,
    readonly navNodeInfoResource: NavNodeInfoResource,
    private readonly projectsNavNodeService: ProjectsNavNodeService,
    navigationService: NavigationService
  ) {
    super();
    this.syncNodeInfoCache = new Map();
    this.onMove = new Executor<INodeMoveData>(null, (current, next) => (
      current.type === next.type
      && current.targetNode === next.targetNode
    ));
    this.navigator = new Executor<INodeNavigationData>(
      {
        type: NavigationType.open,
        nodeId: ROOT_NODE_PATH,
        parentId: ROOT_NODE_PATH,
      },
      (active, current) => (
        active.projectId === current.projectId
        && active.nodeId === current.nodeId
        && active.type === current.type
      )
    )
      .before(navigationService.navigationTask, undefined, data => data.type === NavigationType.open)
      .addHandler(this.navigateHandler.bind(this));

    makeObservable(this, {
      syncNodeInfoCache: observable,
    });
  }

  register(): void { }

  load(): void { }

  getNavNodeCache(nodeId: string): INavNodeCache {
    return this.syncNodeInfoCache.get(nodeId) || { canOpen: false, canMove: false };
  }

  async canMove(targetNode: NavNode, moveContexts: IDataContextProvider): Promise<boolean> {
    const contexts = await this.onMove.execute({
      type: ENodeMoveType.CanDrop,
      targetNode,
      moveContexts,
    });

    const move = contexts.getContext(navNodeMoveContext);

    let cache = this.syncNodeInfoCache.get(targetNode.id);

    if (!cache) {
      cache = observable<INavNodeCache>({ canOpen: false, canMove: move.canMove });
      this.syncNodeInfoCache.set(targetNode.id, cache);
    }

    cache.canMove = move.canMove;

    return move.canMove;
  }

  async canOpen(nodeId: string, parentId: string, folderId?: string): Promise<boolean> {
    if (!this.navNodeInfoResource.has(nodeId)) {
      return false;
    }

    const contexts = await this.navigator.execute({
      type: NavigationType.canOpen,
      nodeId,
      parentId,
      folderId,
    });

    const data = await contexts.getContext(this.navigationNavNodeContext);

    let cache = this.syncNodeInfoCache.get(nodeId);

    if (!cache) {
      cache = observable<INavNodeCache>({ canOpen: data.canOpen, canMove: false });
      this.syncNodeInfoCache.set(nodeId, cache);
    }

    cache.canOpen = data.canOpen;

    return data.canOpen;
  }

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

    return (
      node.objectFeatures.includes(ENodeFeature.dataContainer)
      || node.objectFeatures.includes(ENodeFeature.container)
    );
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

  navigationNavNodeContext: ISyncContextLoader<INodeNavigationContext, INodeNavigationData> = (
    contexts,
    data
  ) => {
    let nodeId = data.nodeId;
    let projectId = data.projectId;
    let parentId = data.parentId;
    let folderId = '';
    let name: string | undefined;
    let icon: string | undefined;
    let canOpen = false;

    if (NodeManagerUtils.isDatabaseObject(nodeId)) {
      const node = this.getNode(nodeId);

      if (node) {
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

        if (!projectId) {
          projectId = this.projectsNavNodeService.getProject(node.id)?.id;
        }
      }
    }

    const markOpen = () => {
      canOpen = true;
    };

    const getParents = () => this.navNodeInfoResource.getParents(nodeId);

    const loadParents = async (parents: string[]) => {
      let parentId = ROOT_NODE_PATH;

      const nodes = await this.navNodeInfoResource.load(resourceKeyList(parents));

      for (const node of nodes) {
        node.parentId = parentId;
        parentId = node.id;
      }
    };

    return {
      get canOpen() {
        return canOpen;
      },

      type: data.type,
      projectId,
      nodeId,
      parentId,
      folderId,
      name,
      icon,

      markOpen,
      getParents,
      loadParents,
    };
  };

  private async navigateHandler(
    data: INodeNavigationData,
    contexts: IExecutionContextProvider<INodeNavigationData>
    // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  ): Promise<void> {
    if (data.type !== NavigationType.open) {
      return;
    }
  }
}

export function parseNodeParentId(nodeId: string): string {
  const parentId = nodeId.slice(0, nodeId.lastIndexOf('/'));

  if (parentId === 'database:/') {
    return ROOT_NODE_PATH;
  }

  return parentId;
}
