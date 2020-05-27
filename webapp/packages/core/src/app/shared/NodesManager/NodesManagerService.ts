/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@dbeaver/core/di';
import { PermissionsService, EPermission } from '@dbeaver/core/root';
import { DatabaseObjectInfo, GraphQLService } from '@dbeaver/core/sdk';

import { INavigator } from '../Navigation/INavigator';
import { IContextProvider } from '../Navigation/NavigationContext';
import { NavigationService } from '../Navigation/NavigationService';
import { ENodeFeature } from './ENodeFeature';
import { EObjectFeature } from './EObjectFeature';
import { NodesStore } from './NodesStore';
import { DatabaseObjectInfoWithId, NodeChildren, NodeWithParent } from './NodeWithParent';

export enum NavigationType {
  open,
  closeConnection
}

export interface INodeContainerInfo {
  connectionId?: string;
  catalogId?: string;
  schemaId?: string;
}

export interface INodeNavigationContext {
  type: NavigationType;
  nodeId: string;
  folderId: string;
  name?: string;
  icon?: string;
}

export interface INodeNavigationData {
  type: NavigationType;
  nodeId: string;
  folderId?: string;
}

const ROOT_NODE_PATH = '/';

// TODO: should be renamed to DBObjectManagerService
@injectable()
export class NodesManagerService {
  readonly navigator!: INavigator<INodeNavigationData>;
  private nodesStore = new NodesStore();

  constructor(private graphQLService: GraphQLService,
              private navigationService: NavigationService,
              private permissionsService: PermissionsService) {

    this.navigator = this.navigationService.createNavigator<INodeNavigationData>(
      data => data.nodeId,
      this.navigateHandler.bind(this),
      {
        type: NavigationType.open,
        nodeId: ROOT_NODE_PATH,
      }
    );
  }

  async closeConnection(nodeId: string) {
    await this.navigator.navigateTo({
      type: NavigationType.closeConnection,
      nodeId,
    });
  }

  async navToNode(nodeId: string, folderId?: string) {
    await this.navigator.navigateTo({
      type: NavigationType.open,
      nodeId,
      folderId,
    });
  }

  refreshNode(nodeId: string) {
    console.log('refresh', nodeId);
  }

  getDatabaseObjectInfo(nodeId: string): DatabaseObjectInfoWithId | undefined {
    return this.nodesStore.getDatabaseObjectInfo(nodeId);
  }

  getNode(nodeId: string): NodeWithParent | undefined {
    return this.nodesStore.getNode(nodeId);
  }

  getChildren(nodeId: string): NodeChildren | undefined {
    return this.nodesStore.getChildren(nodeId);
  }

  async updateNodeInfo(nodeId: string) {
    const { navNodeInfo } = await this.graphQLService.gql.navNodeInfo({
      nodePath: nodeId,
    });

    let parentId = nodeId.match(/^(.*)\/.*?$/)![1];
    if (parentId === 'database:/') {
      parentId = ROOT_NODE_PATH;
    }

    const newNode = { ...navNodeInfo, parentId };
    this.nodesStore.updateNodeInfo(newNode);
    return newNode;
  }

  async updateDatabaseObjectInfo(nodeId: string) {
    const node = this.nodesStore.getNode(nodeId);
    if (!node) {
      await this.updateNodeInfo(nodeId);
    }

    const { objectInfo } = await this.graphQLService.gql.queryDatabaseObjectInfo({
      nodeId,
      // filter: { features: ['viewable', 'editPossible'] },
    });

    const info = { ...objectInfo.object, id: objectInfo.id };
    this.nodesStore.updateDatabaseObjectInfo(info);
    return info;
  }

  async updateChildren(parentId: string) {
    const { navNodeChildren } = await this.graphQLService.gql.navNodeChildren({
      parentPath: parentId,
    });
    const children = navNodeChildren.map(child => child.id);
    this.nodesStore.updateChildren(parentId, children);
    for (const child of navNodeChildren) {
      this.nodesStore.updateNodeInfo({ ...child, parentId });
    }
    return children;
  }

  async updateRootChildren() {
    if (!await this.permissionsService.hasAsync(EPermission.public)) {
      return;
    }
    this.updateChildren(ROOT_NODE_PATH);
  }

  async updateChildrenDatabaseObjectInfo(nodeId: string) {
    const {
      childrenDatabaseObjectInfo,
    } = await this.graphQLService.gql.queryChildrenDatabaseObjectInfo({
      nodePath: nodeId,
      // filter: { features: ['viewable', 'editPossible'] }, // filter properties for view
    });

    const children = childrenDatabaseObjectInfo.map(children => ({
      ...children.object,
      id: children.id,
    }));
    this.nodesStore.updateChildrenDatabaseObjectInfo(children);

    return children;
  }

  async loadNodeInfo(nodeId: string): Promise<NodeWithParent> {
    let node = this.nodesStore.getNode(nodeId);
    if (node) {
      if (node.parentId !== ROOT_NODE_PATH) {
        await this.loadNodeInfo(node.parentId);
      }
      return node;
    }

    node = await this.updateNodeInfo(nodeId);

    if (node.parentId !== ROOT_NODE_PATH) {
      await this.loadNodeInfo(node.parentId);
    }

    return node;
  }

  async loadChildren(parentId = ROOT_NODE_PATH): Promise<string[]> {
    const nodeChildren = this.nodesStore.getChildren(parentId);
    if (nodeChildren?.isLoaded) {
      return nodeChildren.children;
    }

    return this.updateChildren(parentId);
  }

  async loadDatabaseObjectInfo(
    nodeId: string
  ): Promise<DatabaseObjectInfo> {
    const databaseObjectInfo = this.nodesStore.getDatabaseObjectInfo(nodeId);
    if (databaseObjectInfo) {
      return databaseObjectInfo;
    }

    return this.updateDatabaseObjectInfo(nodeId);
  }

  async loadChildrenDatabaseObjectInfo(parentId: string): Promise<DatabaseObjectInfoWithId[]> {
    const children = await this.loadChildren(parentId);
    const childrenDatabaseObjectInfo: DatabaseObjectInfoWithId[] = [];
    for (const child of children) {
      const databaseObjectInfo = this.nodesStore.getDatabaseObjectInfo(child);
      if (!databaseObjectInfo) {
        return this.updateChildrenDatabaseObjectInfo(parentId);
      }
      childrenDatabaseObjectInfo.push(databaseObjectInfo);
    }

    return childrenDatabaseObjectInfo;
  }

  getParent(node: NodeWithParent) {
    return this.nodesStore.getNode(node.parentId);
  }

  getNodeContainerInfo(nodeId: string): INodeContainerInfo {
    const initial: INodeContainerInfo = {};

    const scanParents = (res: INodeContainerInfo,
                         nodeId?: string): INodeContainerInfo => {
      if (!nodeId) {
        return res;
      }
      const node = this.getNode(nodeId);
      if (!node) {
        return res;
      }
      if (node?.object?.features?.includes(EObjectFeature.dataSource)) {
        res.connectionId = node.id;
      }
      if (node?.object?.features?.includes(EObjectFeature.catalog)) {
        res.catalogId = node.name; // note that catalogId is node name
      }
      if (node?.object?.features?.includes(EObjectFeature.schema)) {
        res.schemaId = node.name; // note that schemaId is node name
      }
      return scanParents(res, node.parentId);
    };

    return scanParents(initial, nodeId);
  }

  removeNodes(path = ROOT_NODE_PATH) {
    this.nodesStore.removeNode(path);
  }

  navigationNodeContext = async (
    contexts: IContextProvider<INodeNavigationData>,
    data: INodeNavigationData
  ): Promise<INodeNavigationContext> => {
    let nodeId = data.nodeId;
    let folderId = '';
    let name: string | undefined;
    let icon: string | undefined;

    if (isDatabaseObject(nodeId) && data.type !== NavigationType.closeConnection) {
      const node = await this.loadNodeInfo(nodeId);
      name = node.name;
      icon = node.icon;

      if (node.folder) {
        const parent = await this.loadNodeInfo(node.parentId);
        folderId = nodeId;
        if (parent && !parent.folder) {
          nodeId = parent.id;
          name = parent.name;
          icon = parent.icon;
        }
      }

      if (data.folderId) {
        folderId = data.folderId;
      }
    }

    return {
      type: data.type,
      nodeId,
      folderId,
      name,
      icon,
    };
  }

  async navigateHandler(contexts: IContextProvider<INodeNavigationData>) {
  }

  isNodeHasData(info?: string | DatabaseObjectInfo) {
    if (typeof info === 'string') {
      info = this.nodesStore.getDatabaseObjectInfo(info);
    }

    if (!info || !info.features) {
      return false;
    }

    return info.features.includes(ENodeFeature.dataContainer)
      || info.features.includes(ENodeFeature.container);
  }
}

export function isDatabaseObject(objectId: string) {
  return /^database:\/\//.test(objectId);
}

export function concatSchemaAndCatalog(catalogId?: string, schemaId?: string) {
  return `${schemaId || ''}${schemaId && catalogId ? '@' : ''}${catalogId || ''}`;
}
