/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, computed, makeObservable, runInAction } from 'mobx';

import { CoreSettingsService } from '@cloudbeaver/core-app';
import { UserInfoResource } from '@cloudbeaver/core-authentication';
import { injectable } from '@cloudbeaver/core-di';
import { Executor, ExecutorInterrupter, IExecutor } from '@cloudbeaver/core-executor';
import { EPermission, SessionPermissionsResource, SessionDataResource } from '@cloudbeaver/core-root';
import {
  GraphQLService,
  CachedMapResource,
  ResourceKey,
  isResourceKeyList,
  ResourceKeyList,
  resourceKeyList,
  NavNodeChildrenQuery as fake,
  ResourceKeyUtils,
  ICachedMapResourceMetadata
} from '@cloudbeaver/core-sdk';
import { MetadataMap } from '@cloudbeaver/core-utils';

import { NavTreeSettingsService } from '../NavTreeSettingsService';
import type { NavNode } from './EntityTypes';
import { NavNodeInfoResource } from './NavNodeInfoResource';

// TODO: so much dirty
export interface NodePath {
  parentPath: string;
}

type NavNodeChildrenQuery = fake & NodePath;

interface INodeMetadata extends ICachedMapResourceMetadata {
  withDetails: boolean;
}

export interface INavNodeMoveData {
  key: ResourceKey<string>;
  target: string;
}

export interface INavNodeRenameData {
  nodeId: string;
  newNodeId: string;
}

@injectable()
export class NavTreeResource extends CachedMapResource<string, string[]> {
  readonly beforeNodeDelete: IExecutor<ResourceKey<string>>;
  readonly onNodeRefresh: IExecutor<string>;
  readonly onNodeRename: IExecutor<INavNodeRenameData>;
  readonly onNodeMove: IExecutor<INavNodeMoveData>;
  protected metadata: MetadataMap<string, INodeMetadata>;

  get childrenLimit(): number {
    return (
      this.navTreeSettingsService.settings.isValueDefault('childrenLimit')
        ? this.coreSettingsService.settings.getValue('app.navigationTree.childrenLimit')
        : this.navTreeSettingsService.settings.getValue('childrenLimit')
    );
  }

  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly navNodeInfoResource: NavNodeInfoResource,
    private readonly coreSettingsService: CoreSettingsService,
    private readonly navTreeSettingsService: NavTreeSettingsService,
    private readonly sessionDataResource: SessionDataResource,
    private readonly userInfoResource: UserInfoResource,
    permissionsResource: SessionPermissionsResource,
  ) {
    super();

    this.beforeNodeDelete = new Executor();
    this.onNodeRename = new Executor();
    this.onNodeMove = new Executor();

    makeObservable<this, 'setNavObject'>(this, {
      childrenLimit: computed,
      setDetails: action,
      setNavObject: action,
      moveToNode: action,
      deleteInNode: action,
      unshiftToNode: action,
      pushToNode: action,
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
    this.userInfoResource.onUserChange.addHandler(action(() => {
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
    await this.load(first);

    for (const nodeId of parents) {
      await this.waitLoad();

      if (!this.navNodeInfoResource.has(nodeId)) {
        return false;
      }

      await this.load(nodeId);
    }

    if (nextNode && !this.navNodeInfoResource.has(nextNode)) {
      return false;
    }

    return true;
  }

  async refreshTree(navNodeId: string, silent = false): Promise<void> {
    await this.graphQLService.sdk.navRefreshNode({
      nodePath: navNodeId,
    });

    if (!silent) {
      this.markTreeOutdated(navNodeId);
    }
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
    const contexts = await this.beforeNodeDelete.execute(key);

    if (ExecutorInterrupter.isInterrupted(contexts)) {
      return;
    }

    const nodePaths = isResourceKeyList(key) ? key.list : [key];

    await this.performUpdate(key, [], async () => {
      const deletedPaths: string[] = [];

      try {
        for (const path of nodePaths) {
          await this.graphQLService.sdk.navDeleteNodes({ nodePaths: [path] });
          deletedPaths.push(path);
        }
      } finally {
        runInAction(() => {
          const deletionMap = new Map<string, string[]>();

          for (const path of deletedPaths) {
            const node = this.navNodeInfoResource.get(path);

            if (node) {
              const deletedIds = deletionMap.get(node.parentId) ?? [];
              deletedIds.push(path);
              deletionMap.set(node.parentId, deletedIds);
            }
          }

          const keys = resourceKeyList([...deletionMap.keys()]);
          const nodes = [...deletionMap.values()];

          this.deleteInNode(keys, nodes);
        });
      }
    });
  }

  async moveTo(key: ResourceKey<string>, target: string): Promise<void> {
    const parents = Array.from(new Set(
      ResourceKeyUtils
        .mapArray(key, key => this.navNodeInfoResource.get(key)?.parentId)
        .filter<string>(((id: string | undefined) => id !== undefined) as any)
    ));

    await this.performUpdate(resourceKeyList(parents), [], async () => {
      this.markDataLoading(target);

      try {
        await this.graphQLService.sdk.navMoveTo({
          nodePaths: ResourceKeyUtils.toArray(key),
          folderPath: target,
        });

        this.moveToNode(key, target);
      } finally {
        this.markDataLoaded(target);
      }
    });

    this.markOutdated(resourceKeyList([...parents, target]));
    await this.onNodeMove.execute({ key, target });
  }

  async changeName(node: NavNode, name: string): Promise<string> {
    const newNodeId = await this.performUpdate(node.parentId, [], async () => {
      this.markDataLoading(node.id);
      try {
        await this.graphQLService.sdk.navRenameNode({
          nodePath: node.id,
          newName: name,
        });

        const parts = node.id.split('/');
        parts.splice(parts.length - 1, 1, name);

        return parts.join('/');
      } finally {
        this.markDataLoaded(node.id);
      }
    });

    this.markOutdated(node.parentId);
    await this.onNodeRename.execute({
      nodeId: node.id,
      newNodeId,
    });
    return newNodeId;
  }

  moveToNode(key: string, target: string): void;
  moveToNode(key: ResourceKeyList<string>, target: string): void;
  moveToNode(keyObject: ResourceKey<string>, target: string): void;
  moveToNode(keyObject: ResourceKey<string>, target: string): void {
    ResourceKeyUtils.forEach(keyObject, key => {
      const parentId = this.navNodeInfoResource.getParent(key);

      if (parentId !== undefined) {
        const currentValue = this.data.get(parentId);

        if (currentValue) {
          const nodeInfo = this.navNodeInfoResource.get(parentId);
          const children = currentValue.filter(value => value !== key);

          if (nodeInfo) {
            nodeInfo.hasChildren = children.length > 0;
          }
          this.data.set(parentId, children);
        }
      }

      this.navNodeInfoResource.setParent(key, target);
    });

    this.pushToNode(target, ResourceKeyUtils.toArray(keyObject));
    this.markUpdated(target);
    this.markUpdated(keyObject);
    this.onItemAdd.execute(keyObject);
  }

  deleteInNode(key: string, value: string[]): void;
  deleteInNode(key: ResourceKeyList<string>, value: string[][]): void;
  deleteInNode(keyObject: ResourceKey<string>, valueObject: string[] | string[][]): void;
  deleteInNode(keyObject: ResourceKey<string>, valueObject: string[] | string[][]): void {
    const deletedKeys: string[] = [];

    ResourceKeyUtils.forEach(keyObject, (key, i) => {
      const values = i === -1 ? (valueObject as string[]) : (valueObject as string[][])[i];
      const currentValue = this.data.get(key);

      if (currentValue) {
        const children = currentValue.filter(value => !values.includes(value));
        const nodeInfo = this.navNodeInfoResource.get(key);

        if (nodeInfo) {
          nodeInfo.hasChildren = children.length > 0;
        }
        this.data.set(key, children);
      }

      deletedKeys.push(...values);
    });

    this.delete(resourceKeyList(deletedKeys));
    this.markOutdated(keyObject);
    this.onItemAdd.execute(keyObject);
  }

  unshiftToNode(key: string, value: string[]): void;
  unshiftToNode(key: ResourceKeyList<string>, value: string[][]): void;
  unshiftToNode(keyObject: ResourceKey<string>, valueObject: string[] | string[][]): void {
    ResourceKeyUtils.forEach(keyObject, (key, i) => {
      const values = i === -1 ? (valueObject as string[]) : (valueObject as string[][])[i];
      const currentValue = this.data.get(key) || [];
      const nodeInfo = this.navNodeInfoResource.get(key);

      currentValue.unshift(...values);

      if (nodeInfo) {
        nodeInfo.hasChildren = currentValue.length > 0;
      }
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
      const nodeInfo = this.navNodeInfoResource.get(key);

      currentValue.push(...values);

      if (nodeInfo) {
        nodeInfo.hasChildren = currentValue.length > 0;
      }
      this.data.set(key, currentValue);
    });

    this.markUpdated(keyObject);
    this.onItemAdd.execute(keyObject);
  }

  insertToNode(nodeId: string, index: number, ...nodes: string[]): void {
    const currentValue = this.data.get(nodeId) || [];
    const nodeInfo = this.navNodeInfoResource.get(nodeId);

    currentValue.splice(index, 0, ...nodes);

    if (nodeInfo) {
      nodeInfo.hasChildren = currentValue.length > 0;
    }
    this.data.set(nodeId, currentValue);

    this.markUpdated(nodeId);
    this.onItemAdd.execute(nodeId);
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
          ...data.map(data => this.navNodeInfoResource.navNodeInfoToNavNode(
            data.navNodeInfo,
            undefined,
            data.parentPath
          )).flat(),
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
          this.navNodeInfoResource.navNodeInfoToNavNode(
            data.navNodeInfo,
            undefined,
            data.parentPath
          ),
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
