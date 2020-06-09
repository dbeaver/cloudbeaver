/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@dbeaver/core/di';
import { PermissionsService, EPermission } from '@dbeaver/core/root';
import { GraphQLService, CachedResource } from '@dbeaver/core/sdk';
import { MetadataMap } from '@dbeaver/core/utils';

import { INavigator } from '../Navigation/INavigator';
import { IContextProvider } from '../Navigation/NavigationContext';
import { NavigationService } from '../Navigation/NavigationService';
import { DBObjectService } from './DBObjectService';
import { ENodeFeature } from './ENodeFeature';
import { NavNodeInfo, NavNode } from './EntityTypes';
import { EObjectFeature } from './EObjectFeature';
import { NodeManagerUtils } from './NodeManagerUtils';

export enum NavigationType {
  open,
  closeConnection
}

export interface NavNodeKey {
  nodeId: string;
  parentId: string;
}

export interface NavNodeValue {
  node: NavNodeInfo;
  parentId: string;
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

interface INavNodeMetadata {
  loaded: boolean;
  loading: boolean;
}

interface INavTreeMetadata {
  loaded: boolean;
  loading: boolean;
}

export const ROOT_NODE_PATH = '/';

@injectable()
export class NavNodeManagerService {
  readonly navNode = new CachedResource(
    new Map(),
    this.loadNavNodeInfo.bind(this),
    (_, metadata, data) => {
      if (data.nodesValue) {
        return false;
      }

      const nodesId = data.navNodeId
        ? data.navNodeId
        : data.nodes.map(node => node.nodeId);

      return nodesId.every(navNodeId => metadata.get(navNodeId).loaded);
    },
    new MetadataMap<string, INavNodeMetadata>(() => ({ loaded: false, loading: false })),
    (_, metadata, data) => {
      if (data.nodesValue) {
        return false;
      }

      const nodesId = data.navNodeId
        ? data.navNodeId
        : data.nodes.map(node => node.nodeId);

      return nodesId.some(navNodeId => metadata.get(navNodeId).loading);
    }
  );
  readonly navTree = new CachedResource(
    new Map(),
    this.loadNavTree.bind(this),
    (_, metadata, parentId) => metadata.get(parentId).loaded,
    new MetadataMap<string, INavTreeMetadata>(() => ({ loaded: false, loading: false })),
    (_, metadata, parentId) => metadata.get(parentId).loading
  )
  readonly navigator!: INavigator<INodeNavigationData>;

  constructor(
    private graphQLService: GraphQLService,
    private navigationService: NavigationService,
    private permissionsService: PermissionsService,
    private dbObjectService: DBObjectService,
  ) {

    this.navigator = this.navigationService.createNavigator<INodeNavigationData>(
      data => data.nodeId,
      this.navigateHandler.bind(this),
      {
        type: NavigationType.open,
        nodeId: ROOT_NODE_PATH,
        parentId: ROOT_NODE_PATH,
      }
    );
  }

  async navToNode(nodeId: string, parentId: string, folderId?: string) {
    await this.navigator.navigateTo({
      type: NavigationType.open,
      nodeId,
      parentId,
      folderId,
    });
  }

  async refresh(navNodeId: string) {
    await this.graphQLService.gql.navRefreshNode({
      nodePath: navNodeId,
    });
    await this.navTree.refresh(true, navNodeId, false);
  }

  async updateRootChildren() {
    if (!await this.permissionsService.hasAsync(EPermission.public)) {
      return;
    }
    await this.navTree.refresh(true, ROOT_NODE_PATH, false);
  }

  getTree(navNodeId: string): string[] | undefined
  getTree(navNodeKey: NavNodeKey): string[] | undefined
  getTree(navNodeKey: NavNodeKey[]): (string[] | undefined)[]
  getTree(navNodeId: string | NavNodeKey | NavNodeKey[]) {
    if (typeof navNodeId === 'string') {
      return this.navTree.data.get(navNodeId);
    }

    if (Array.isArray(navNodeId)) {
      return navNodeId.map(node => this.navTree.data.get(node.nodeId));
    }

    return this.navTree.data.get(navNodeId.nodeId);
  }

  async loadTree(navNodeId: string) {
    await this.navTree.load(navNodeId, false);
    return this.getTree(navNodeId)!;
  }

  getNode(navNodeId: string): NavNode | undefined
  getNode(navNodeKey: NavNodeKey): NavNode | undefined
  getNode(navNodeKey: NavNodeKey[]): (NavNode | undefined)[]
  getNode(navNodeId: string | NavNodeKey | NavNodeKey[]) {
    if (typeof navNodeId === 'string') {
      return this.navNode.data.get(navNodeId);
    }

    if (Array.isArray(navNodeId)) {
      return navNodeId.map(node => this.navNode.data.get(node.nodeId));
    }

    return this.navNode.data.get(navNodeId.nodeId);
  }

  getNestedChildren(navNode: string | string[]) {
    const nestedChildren: string[] = [];
    let prevChildren: string[];
    if (Array.isArray(navNode)) {
      prevChildren = navNode.concat();
      nestedChildren.push(...navNode);
    } else {
      prevChildren = (this.getTree(navNode)?.concat() || []);
      nestedChildren.push(...prevChildren);
    }

    while (prevChildren.length) {
      const nodeKey = prevChildren.shift()!;
      const children = this.getTree(nodeKey) || [];
      prevChildren.push(...children);
      nestedChildren.push(...children);
    }

    return nestedChildren;
  }

  async loadNode(node: NavNodeKey): Promise<NavNode>
  async loadNode(...nodes: NavNodeKey[]): Promise<NavNode>
  async loadNode(...nodes: NavNodeKey[]) {
    await this.navNode.load({ nodes });

    if (nodes.length === 1) {
      return this.getNode(nodes[0])!;
    }

    return this.getNode(nodes);
  }

  getParent(node: NavNode) {
    return this.navNode.data.get(node.parentId);
  }

  isNodeHasData(node?: string | NavNode) {
    if (typeof node === 'string') {
      node = this.getNode(node);
    }

    if (!node || !node.objectFeatures) {
      return false;
    }

    return node.objectFeatures.includes(ENodeFeature.dataContainer)
      || node.objectFeatures.includes(ENodeFeature.container);
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

  async remove(path = ROOT_NODE_PATH) {
    await this.navTree.refresh(true, path, true);
  }

  navigationNavNodeContext = async (
    contexts: IContextProvider<INodeNavigationData>,
    data: INodeNavigationData
  ): Promise<INodeNavigationContext> => {
    let nodeId = data.nodeId;
    let parentId = data.parentId;
    let folderId = '';
    let name: string | undefined;
    let icon: string | undefined;

    if (NodeManagerUtils.isDatabaseObject(nodeId) && data.type !== NavigationType.closeConnection) {
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

      while (parent && parent.parentId !== ROOT_NODE_PATH) {
        parents.unshift(parent.parentId);
        parent = this.getNode(parent.parentId);
      }

      return parents;
    };

    const loadParents = async (parents: string[]) => {
      let parentId = ROOT_NODE_PATH;

      await this.navNode.load({
        nodes: parents.map((nodeId) => {
          try {
            return { nodeId, parentId };
          } finally {
            parentId = nodeId;
          }
        }),
      });
    };

    return {
      type: data.type,
      nodeId,
      parentId,
      folderId,
      name,
      icon,
      getParents,
      loadParents,
    };
  }

  private async navigateHandler(contexts: IContextProvider<INodeNavigationData>) {
  }

  private async loadNavNodeInfo(
    navNode: Map<string, NavNode>,
    metadata: MetadataMap<string, INavNodeMetadata>,
    load: boolean,
    data: INavNodePath | INavNodeData | INavNodeId,
  ) {
    if (data.nodesValue) {
      for (const nodeValue of data.nodesValue) {
        const itemMetadata = metadata.get(nodeValue.node.id);
        navNode.set(nodeValue.node.id, {
          ...nodeValue.node,
          objectFeatures: nodeValue.node.object?.features || [],
          parentId: nodeValue.parentId,
        });
        itemMetadata.loaded = true;
      }
      return navNode;
    }

    const nodesId = data.navNodeId
      ? data.navNodeId
      : data.nodes.map(node => node.nodeId);

    if (data.remove) {
      for (const navNodeId of nodesId) {
        navNode.delete(navNodeId);
        metadata.delete(navNodeId);
      }

      await this.dbObjectService.remove(nodesId);
      return navNode;
    }

    for (const navNodeId of nodesId) {
      const itemMetadata = metadata.get(navNodeId);

      try {
        itemMetadata.loaded = false;
        if (load) {
          itemMetadata.loading = true;
          const { navNodeInfo } = await this.graphQLService.gql.navNodeInfo({
            nodePath: navNodeId,
          });

          let parentId = ROOT_NODE_PATH;
          if (data.navNodeId) {
            parentId = navNode.get(navNodeId)?.parentId || parentId;
          } else {
            parentId = data.nodes.find(node => node.nodeId === navNodeId)?.parentId || parentId;
          }

          navNode.set(navNodeId, {
            ...navNodeInfo,
            objectFeatures: navNodeInfo.object?.features || [],
            parentId,
          });
          itemMetadata.loaded = true;
        }
      } finally {
        itemMetadata.loading = false;
      }
    }

    if (load) {
      await this.dbObjectService.dbObject.refresh(false, { navNodeId: nodesId });
    }

    return navNode;
  }

  private async loadNavTree(
    navTree: Map<string, string[]>,
    metadata: MetadataMap<string, INavTreeMetadata>,
    load: boolean,
    parentId: string,
    remove: boolean
  ) {
    const itemMetadata = metadata.get(parentId);
    let childrenToRemove = navTree.get(parentId)?.concat() || [];

    if (remove) {
      childrenToRemove = [parentId];
    } else {
      try {
        itemMetadata.loaded = false;
        if (load) {
          itemMetadata.loading = true;

          const { navNodeChildren } = await this.graphQLService.gql.navNodeChildren({
            parentPath: parentId,
          });

          await this.navNode.refresh(true, {
            nodesValue: navNodeChildren.map(node => ({ node, parentId })),
          });
          navTree.set(parentId, navNodeChildren.map(node => node.id));
          itemMetadata.loaded = true;
        }
      } finally {
        itemMetadata.loading = false;
      }

      const newChildren = navTree.get(parentId);
      const nestedChildren = this.getNestedChildren(parentId);

      await this.navNode.refresh(false, {
        navNodeId: nestedChildren.filter(navNodeId => !newChildren || !newChildren.includes(navNodeId)),
      });

      for (const navNodeId of nestedChildren) {
        const itemMetadata = metadata.get(navNodeId);
        itemMetadata.loaded = false;
      }

      if (newChildren) {
        childrenToRemove = childrenToRemove.filter(navNodeId => !newChildren.includes(navNodeId));
      }
    }

    const nestedChildren = this.getNestedChildren(childrenToRemove);
    await this.navNode.refresh(true, { navNodeId: nestedChildren, remove: true });
    for (const navNodeId of nestedChildren) {
      navTree.delete(navNodeId);
      metadata.delete(navNodeId);
    }

    return navTree;
  }
}
