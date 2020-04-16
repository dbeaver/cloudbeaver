/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@dbeaver/core/di';
import { NotificationService } from '@dbeaver/core/eventsLog';
import { DatabaseObjectInfo, GraphQLService } from '@dbeaver/core/sdk';

import { IConnectionCatalogSchema } from '../../TopNavBar/ConnectionSchemaManager/IConnectionCatalogSchema';
import { INavigator } from '../Navigation/INavigator';
import { IContextProvider } from '../Navigation/NavigationContext';
import { NavigationService } from '../Navigation/NavigationService';
import { NavigationTabsService } from '../NavigationTabs/NavigationTabsService';
import { ENodeFeature } from './ENodeFeature';
import { EObjectFeature } from './EObjectFeature';
import { NodesStore } from './NodesStore';
import { DatabaseObjectInfoWithId, NodeChildren, NodeWithParent } from './NodeWithParent';

export interface INodeNavigationContext {
  nodeId: string;
  childrenId: string;
  name?: string;
  icon?: string;
}

export interface INodeNavigationData {
  nodeId: string;
}

const ROOT_NODE_PATH = '/';

@injectable()
export class NodesManagerService {
  readonly navigator!: INavigator<INodeNavigationData>;
  private nodesStore = new NodesStore();

  constructor(private graphQLService: GraphQLService,
              private navigationService: NavigationService,
              private navigationTabsService: NavigationTabsService,
              private notificationService: NotificationService) {

    this.navigator = this.navigationService.createNavigator<INodeNavigationData>(
      data => data.nodeId,
      this.navigateHandler.bind(this),
      {
        nodeId: ROOT_NODE_PATH,
      }
    );
  }

  navToNode(nodeId: string) {
    this.navigator.navigateTo({ nodeId });
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
      filter: { features: ['viewable', 'editPossible'] },
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
    return this.updateChildren(ROOT_NODE_PATH);
  }

  async updateChildrenDatabaseObjectInfo(nodeId: string) {
    const {
      childrenDatabaseObjectInfo,
    } = await this.graphQLService.gql.queryChildrenDatabaseObjectInfo({
      nodePath: nodeId,
      filter: { features: ['viewable', 'editPossible'] }, // filter properties for view
    });

    const children = childrenDatabaseObjectInfo.map(children => ({
      ...children.object,
      id: children.id,
    }));
    this.nodesStore.updateChildrenDatabaseObjectInfo(children);

    return children;
  }

  async loadNodeInfo(nodeId: string): Promise<NodeWithParent> {
    const node = this.nodesStore.getNode(nodeId);
    if (node) {
      return node;
    }

    return this.updateNodeInfo(nodeId);
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

  getConnectionCatalogSchema(nodeId: string): Partial<IConnectionCatalogSchema> {
    const initial: Partial<IConnectionCatalogSchema> = {};

    const scanParents = (res: Partial<IConnectionCatalogSchema>,
                         nodeId?: string): Partial<IConnectionCatalogSchema> => {
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
      if (node?.object?.features?.includes(EObjectFeature.schema)) {
        res.schemaId = node.name || null; // note that schemaId is node name
      }
      if (node?.object?.features?.includes(EObjectFeature.catalog)) {
        res.catalogId = node.name || null; // note that catalogId is node name
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
    let childrenId = '';
    const node = await this.loadNodeInfo(nodeId);
    let name = node.name;
    let icon = node.icon;

    if (node.folder) {
      const parent = await this.loadNodeInfo(node.parentId);
      childrenId = nodeId;
      if (parent && !parent.folder) {
        nodeId = parent.id;
        name = parent.name;
        icon = parent.icon;
      }
    }

    return {
      nodeId,
      childrenId,
      name,
      icon,
    };
  }

  async navigateHandler(contexts: IContextProvider<INodeNavigationData>) {
    try {
      const nodeInfo = await contexts.getContext(this.navigationNodeContext);
      const tab = this.navigationTabsService.getTab(nodeInfo.nodeId);

      if (tab) {
        tab.name = nodeInfo.name;
        tab.icon = nodeInfo.icon;
      }
    } catch (exception) {
      this.notificationService.logException(exception, 'Can\'t perform action with database object');
    }
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
