/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, computed, makeObservable, runInAction } from 'mobx';

import { UserInfoResource } from '@cloudbeaver/core-authentication';
import { Connection, ConnectionInfoResource } from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import { Executor, IExecutor } from '@cloudbeaver/core-executor';
import { EPermission, PermissionsResource, SessionDataResource } from '@cloudbeaver/core-root';
import {
  GraphQLService,
  CachedMapResource,
  ResourceKey,
  isResourceKeyList,
  ResourceKeyList,
  resourceKeyList,
  NavNodeChildrenQuery as fake,
  ResourceKeyUtils,
  ICachedMapResourceMetadata,
  CachedMapAllKey
} from '@cloudbeaver/core-sdk';
import { MetadataMap } from '@cloudbeaver/core-utils';

import { CoreSettingsService } from '../../CoreSettingsService';
import type { NavNode } from './EntityTypes';
import { NavNodeInfoResource, ROOT_NODE_PATH } from './NavNodeInfoResource';
import { NodeManagerUtils } from './NodeManagerUtils';

// TODO: so much dirty
export interface NodePath {
  parentPath: string;
}

type NavNodeChildrenQuery = fake & NodePath;

interface INodeMetadata extends ICachedMapResourceMetadata {
  withDetails: boolean;
}

@injectable()
export class NavTreeResource extends CachedMapResource<string, string[]> {
  readonly onNodeRefresh: IExecutor<string>;
  protected metadata: MetadataMap<string, INodeMetadata>;

  get childrenLimit(): number {
    return this.coreSettingsService.settings.getValue('app.navigationTree.childrenLimit');
  }

  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly navNodeInfoResource: NavNodeInfoResource,
    private readonly coreSettingsService: CoreSettingsService,
    private readonly sessionDataResource: SessionDataResource,
    private readonly connectionInfo: ConnectionInfoResource,
    private readonly userInfoResource: UserInfoResource,
    permissionsResource: PermissionsResource,
  ) {
    super();

    makeObservable<this, 'setNavObject' | 'connectionRemoveHandler'>(this, {
      childrenLimit: computed,
      setDetails: action,
      setNavObject: action,
      deleteInNode: action,
      unshiftToNode: action,
      pushToNode: action,
      connectionRemoveHandler: action.bound,
    });

    this.metadata = new MetadataMap<string, INodeMetadata>(() => ({
      outdated: true,
      loading: false,
      withDetails: false,
      exception: null,
      includes: [],
    }));

    permissionsResource.require(this, EPermission.public);
    // this.preloadResource(connectionInfo, () => CachedMapAllKey);

    this.onNodeRefresh = new Executor<string>(null, (a, b) => a === b);

    // navNodeInfoResource.preloadResource(this);
    this.outdateResource(navNodeInfoResource);
    this.updateResource(navNodeInfoResource);
    this.sessionDataResource.outdateResource(this);
    this.connectionInfo.onItemAdd.addHandler(this.connectionUpdateHandler.bind(this));
    this.connectionInfo.onItemDelete.addHandler(this.connectionRemoveHandler);
    this.connectionInfo.onConnectionCreate.addHandler(this.connectionCreateHandler.bind(this));
    this.userInfoResource.userChange.addHandler(action(() => {
      this.clear();
      this.navNodeInfoResource.clear(); // TODO: need more convenient way
    }));
  }

  async preloadNodeParents(
    parents: string[],
    nextNode?: string
  ): Promise<boolean> {
    if (parents.length === 0) {
      return true;
    }

    const first = parents[0];
    await this.connectionInfo.load(CachedMapAllKey);
    await this.load(first);

    for (const nodeId of parents) {
      await this.waitLoad();

      if (!this.navNodeInfoResource.has(nodeId)) {
        return false;
      }

      const connection = this.connectionInfo.getConnectionForNode(nodeId);

      if (connection && !connection.connected) {
        return false;
      }

      await this.load(nodeId);
    }

    if (nextNode && !this.navNodeInfoResource.has(nextNode)) {
      return false;
    }

    return true;
  }

  async refreshTree(navNodeId: string): Promise<void> {
    await this.graphQLService.sdk.navRefreshNode({
      nodePath: navNodeId,
    });
    this.markTreeOutdated(navNodeId);
    await this.onNodeRefresh.execute(navNodeId);
  }

  markTreeOutdated(navNodeId: ResourceKey<string>): void {
    this.markOutdated(resourceKeyList(this.getNestedChildren(navNodeId)));
  }

  setDetails(keyObject: ResourceKey<string>, state: boolean): void {
    ResourceKeyUtils.forEach(keyObject, key => {
      const children = resourceKeyList(this.getNestedChildren(key));
      this.navNodeInfoResource.setDetails(children, state);

      ResourceKeyUtils.forEach(children, key => {
        const metadata = this.metadata.get(key);

        if (!metadata.withDetails && state) {
          metadata.outdated = true;
        }
        metadata.withDetails = state;
      });
    });
  }

  async deleteNode(key: ResourceKey<string>): Promise<void> {
    const nodePaths = isResourceKeyList(key) ? key.list : [key];

    await this.performUpdate(key, [], async () => {
      await this.graphQLService.sdk.navDeleteNodes({ nodePaths });

      runInAction(() => {
        const parents: string[] = [];
        const deletedIds: string[][] = [];

        for (const path of nodePaths) {
          const node = this.navNodeInfoResource.get(path);

          if (node) {
            parents.push(node.parentId);
            deletedIds.push([path]);
          }
        }

        this.deleteInNode(resourceKeyList(parents), deletedIds);
      });
    });
  }

  async changeName(node: NavNode, name: string): Promise<void> {
    await this.performUpdate(node.parentId, [], async () => {
      this.markDataLoading(node.id);
      try {
        await this.graphQLService.sdk.navRenameNode({
          nodePath: node.id,
          newName: name,
        });
      } finally {
        this.markDataLoaded(node.id);
      }
    });

    this.markOutdated(node.parentId);
  }

  deleteInNode(key: string, value: string[]): void;
  deleteInNode(key: ResourceKeyList<string>, value: string[][]): void;
  deleteInNode(keyObject: ResourceKey<string>, valueObject: string[] | string[][]): void {
    const deletedKeys: string[] = [];

    ResourceKeyUtils.forEach(keyObject, (key, i) => {
      const values = i === -1 ? (valueObject as string[]) : (valueObject as string[][])[i];
      const currentValue = this.data.get(key);

      if (currentValue) {
        this.data.set(key, currentValue.filter(value => !values.includes(value)));
      }

      deletedKeys.push(...values);
    });

    this.delete(resourceKeyList(deletedKeys));
    this.markUpdated(keyObject);
    this.onItemAdd.execute(keyObject);
  }

  unshiftToNode(key: string, value: string[]): void;
  unshiftToNode(key: ResourceKeyList<string>, value: string[][]): void;
  unshiftToNode(keyObject: ResourceKey<string>, valueObject: string[] | string[][]): void {
    ResourceKeyUtils.forEach(keyObject, (key, i) => {
      const values = i === -1 ? (valueObject as string[]) : (valueObject as string[][])[i];
      const currentValue = this.data.get(key) || [];

      currentValue.unshift(...values);
      this.data.set(key, currentValue);
    });

    this.markUpdated(keyObject);
    this.onItemAdd.execute(keyObject);
  }

  pushToNode(key: string, value: string[]): void;
  pushToNode(key: ResourceKeyList<string>, value: string[][]): void;
  pushToNode(keyObject: ResourceKey<string>, valueObject: string[] | string[][]): void {
    ResourceKeyUtils.forEach(keyObject, (key, i) => {
      const values = i === -1 ? (valueObject as string[]) : (valueObject as string[][])[i];
      const currentValue = this.data.get(key) || [];

      currentValue.push(...values);
      this.data.set(key, currentValue);
    });

    this.markUpdated(keyObject);
    this.onItemAdd.execute(keyObject);
  }

  set(key: string, value: string[]): void;
  set(key: ResourceKeyList<string>, value: string[][]): void;
  set(keyObject: ResourceKey<string>, valueObject: string[] | string[][]): void {
    const childrenToRemove: string[] = [];
    ResourceKeyUtils.forEach(keyObject, (key, i) => {
      const value = i === -1 ? (valueObject as string[]) : (valueObject as string[][])[i];
      const children = this.data.get(key) || [];
      childrenToRemove.push(...children.filter(navNodeId => !value.includes(navNodeId)));
      this.data.set(key, value);
    });

    this.delete(resourceKeyList(childrenToRemove));
    this.markUpdated(keyObject);
    this.onItemAdd.execute(keyObject);
  }

  delete(key: string): void;
  delete(key: ResourceKeyList<string>): void;
  delete(key: ResourceKey<string>): void;
  delete(key: ResourceKey<string>): void {
    const items = this.getNestedChildren(key);

    if (items.length === 0) {
      return;
    }

    const allKeys = resourceKeyList(items);

    this.onItemDelete.execute(allKeys);
    ResourceKeyUtils.forEach(allKeys, key => {
      this.dataDelete(key);
      this.metadata.delete(key);
    });
    this.markUpdated(allKeys);

    this.navNodeInfoResource.delete(allKeys);
  }

  protected async loader(key: ResourceKey<string>): Promise<Map<string, string[]>> {
    const limit = this.childrenLimit + 1;
    if (isResourceKeyList(key)) {
      const values: NavNodeChildrenQuery[] = [];
      for (const nodePath of key.list) {
        values.push(await this.loadNodeChildren(nodePath, 0, limit));
      }
      this.setNavObject(values);
    } else {
      this.setNavObject(await this.loadNodeChildren(key, 0, limit));
    }

    return this.data;
  }

  getNestedChildren(navNode: ResourceKey<string>): string[] {
    const nestedChildren: string[] = [];
    let prevChildren: string[];

    if (isResourceKeyList(navNode)) {
      prevChildren = navNode.list.concat();
    } else {
      prevChildren = [navNode, ...(this.get(navNode) || [])];
    }

    nestedChildren.push(...prevChildren);

    while (prevChildren.length) {
      const nodeKey = prevChildren.shift()!;
      const children = this.get(nodeKey) || [];
      prevChildren.push(...children);
      nestedChildren.push(...children);
    }

    return nestedChildren;
  }

  private connectionUpdateHandler(key: ResourceKey<string>) {
    const outdatedTrees: string[] = [];
    const outdatedFolders: string[] = [];
    const closedConnections: string[] = [];

    ResourceKeyUtils.forEach(key, key => {
      const connectionInfo = this.connectionInfo.get(key);

      if (!connectionInfo?.nodePath) {
        return;
      }

      if (!this.navNodeInfoResource.has(connectionInfo.nodePath)) {
        return;
      }

      if (!connectionInfo.connected) {
        closedConnections.push(connectionInfo.nodePath);

        const folder = /* connectionInfo.folder || */ ROOT_NODE_PATH;

        if (!outdatedFolders.includes(folder)) {
          outdatedFolders.push(folder);
        }
      } else {
        outdatedTrees.push(connectionInfo.nodePath);
      }
    });

    if (closedConnections.length > 0) {
      const key = resourceKeyList(closedConnections);
      this.set(key, closedConnections.map(() => []));
    }

    if (outdatedTrees.length > 0 || outdatedFolders.length > 0) {
      const key = resourceKeyList([...outdatedTrees, ...outdatedFolders]);
      this.markOutdated(key);
    }
  }

  private connectionRemoveHandler(key: ResourceKey<string>) {
    ResourceKeyUtils.forEach(key, key => {
      const connectionInfo = this.connectionInfo.get(key);

      if (!connectionInfo) {
        return;
      }

      let nodePath = connectionInfo.nodePath;

      if (!nodePath) {
        nodePath = NodeManagerUtils.connectionIdToConnectionNodeId(key);
      }

      const folder = /* connectionInfo.folder || */ ROOT_NODE_PATH;

      if (nodePath) {
        this.deleteInNode(folder, [nodePath]);
      }
    });
  }

  private async connectionCreateHandler(connection: Connection) {
    if (!connection.nodePath) {
      return;
    }
    const folder = /* connection.folder || */ ROOT_NODE_PATH;

    const children = this.get(folder);

    if (!children) {
      return;
    }

    const connectionNode = await this.navNodeInfoResource.load(connection.nodePath);
    this.navNodeInfoResource.setParent(connection.nodePath, folder);

    let insertIndex = 0;

    const nodes = this.navNodeInfoResource.get(resourceKeyList(children));

    for (const node of nodes) {
      if (!node?.folder && node?.name?.localeCompare(connectionNode.name!) === 1) {
        break;
      }
      insertIndex++;
    }

    children.splice(insertIndex, 0, connection.nodePath);
  }

  private setNavObject(data: NavNodeChildrenQuery | NavNodeChildrenQuery[]) {
    if (Array.isArray(data)) {
      for (const node of data) {
        const metadata = this.metadata.get(node.parentPath);

        this.setDetails(resourceKeyList([
          node.navNodeInfo.id,
          ...node.navNodeChildren.map(node => node.id),
        ]), metadata.withDetails);
      }

      this.navNodeInfoResource.updateNode(
        resourceKeyList([
          ...data.map(data => data.parentPath),
          ...data.map(data => data.navNodeChildren.map(node => node.id)).flat(),
        ]), [
          ...data.map(data => this.navNodeInfoResource.navNodeInfoToNavNode(data.navNodeInfo)).flat(),
          ...data.map(
            data => data.navNodeChildren.map(
              node => this.navNodeInfoResource.navNodeInfoToNavNode(node, data.parentPath)
            )
          ).flat(),
        ]);

      this.set(
        resourceKeyList(data.map(data => data.parentPath)),
        data.map(data => data.navNodeChildren.map(node => node.id))
      );
    } else {
      const metadata = this.metadata.get(data.parentPath);

      this.setDetails(resourceKeyList([
        data.navNodeInfo.id,
        ...data.navNodeChildren.map(node => node.id),
      ]), metadata.withDetails);

      this.navNodeInfoResource.updateNode(
        resourceKeyList([
          data.parentPath,
          ...data.navNodeChildren.map(node => node.id),
        ]), [
          this.navNodeInfoResource.navNodeInfoToNavNode(data.navNodeInfo),
          ...data.navNodeChildren.map(node => this.navNodeInfoResource.navNodeInfoToNavNode(node, data.parentPath)),
        ]
      );

      this.set(data.parentPath, data.navNodeChildren.map(node => node.id));
    }
  }

  private async loadNodeChildren(
    parentPath: string,
    offset: number,
    limit: number
  ): Promise<NavNodeChildrenQuery> {
    const metadata = this.metadata.get(parentPath);
    const { navNodeChildren, navNodeInfo } = await this.graphQLService.sdk.navNodeChildren({
      parentPath,
      offset,
      limit,
      withDetails: metadata.withDetails,
    });

    navNodeInfo.hasChildren = navNodeInfo.hasChildren && navNodeChildren.length > 0;

    return { navNodeChildren, navNodeInfo, parentPath };
  }
}
