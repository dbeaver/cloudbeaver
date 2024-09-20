/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, makeObservable, observable, runInAction } from 'mobx';

import { AppAuthService } from '@cloudbeaver/core-authentication';
import { injectable } from '@cloudbeaver/core-di';
import {
  CachedMapResource,
  type ICachedResourceMetadata,
  isResourceAlias,
  type ResourceKey,
  type ResourceKeyList,
  resourceKeyList,
  type ResourceKeySimple,
  ResourceKeyUtils,
} from '@cloudbeaver/core-resource';
import { GraphQLService, type NavNodeInfoFragment } from '@cloudbeaver/core-sdk';
import { getPathParents, MetadataMap } from '@cloudbeaver/core-utils';

import type { NavNode } from './EntityTypes.js';

type NavNodeInfo = NavNodeInfoFragment;

export const ROOT_NODE_PATH = '';

interface INodeMetadata extends ICachedResourceMetadata {
  withDetails: boolean;
}

@injectable()
export class NavNodeInfoResource extends CachedMapResource<string, NavNode, Record<string, unknown>, INodeMetadata> {
  constructor(
    private readonly graphQLService: GraphQLService,
    appAuthService: AppAuthService,
  ) {
    super();

    makeObservable(this, {
      setDetails: action,
      setParent: action,
    });

    appAuthService.requireAuthentication(this);
  }

  setDetails(keyObject: ResourceKeySimple<string>, state: boolean): void {
    this.metadata.update(keyObject, metadata => {
      if (!metadata.withDetails && state) {
        metadata.outdated = true;
        metadata.outdatedIncludes = observable([...metadata.includes]);
      }
      metadata.withDetails = state;
    });
  }

  getParents(key: string): string[] {
    const parents: string[] = [];
    let current = this.get(key);

    if (!current) {
      return getPathParents(key);
    }

    while (current && current.parentId !== undefined) {
      parents.unshift(current.parentId);
      current = this.get(current.parentId);
    }

    return parents;
  }

  getParent(key: string): string | undefined;
  getParent(key: ResourceKeyList<string>): (string | undefined)[];
  getParent(key: ResourceKeySimple<string>): string | undefined | (string | undefined)[];
  getParent(key: ResourceKeySimple<string>): string | undefined | (string | undefined)[] {
    return ResourceKeyUtils.map(key, key => this.get(key)?.parentId);
  }

  setParent(key: string, parentId?: string): void;
  setParent(key: ResourceKeyList<string>, parentId?: string): void;
  setParent(key: ResourceKeySimple<string>, parentId?: string): void;
  setParent(key: ResourceKeySimple<string>, parentId?: string): void {
    ResourceKeyUtils.forEach(key, key => {
      const node = this.get(key);

      if (node) {
        node.parentId = parentId;
      }
    });
  }

  protected async loader(key: ResourceKey<string>): Promise<Map<string, NavNode>> {
    if (isResourceAlias(key)) {
      throw new Error('Aliases not supported by this resource');
    }
    const values: NavNode[] = [];

    await ResourceKeyUtils.forEachAsync(key, async nodePath => {
      values.push(await this.loadNodeInfo(nodePath));
    });
    this.set(ResourceKeyUtils.toList(key), values);

    return this.data;
  }

  navNodeInfoToNavNode(node: NavNodeInfo, parentId?: string): NavNode {
    const oldNode = this.get(node.id);

    let newNode: NavNode = {
      ...node,
      objectFeatures: node.object?.features || [],
      parentId: parentId ?? oldNode?.parentId,
    };

    if (oldNode) {
      newNode = observable({ ...oldNode, ...newNode });
    }

    return newNode;
  }

  async loadNodeFullName(nodePath: string): Promise<NavNode> {
    const node = await this.load(nodePath);
    const { navNodeInfo } = await this.graphQLService.sdk.getNavNodeFullName({
      nodePath,
    });

    node.fullName = navNodeInfo.fullName;

    return node;
  }

  async loadNodeFilter(nodePath: string) {
    const { navNodeInfo } = await this.graphQLService.sdk.navNodeInfo({
      nodePath,
      withDetails: false,
      withFilters: true,
    });

    return navNodeInfo.filter;
  }

  private async loadNodeInfo(nodePath: string): Promise<NavNode> {
    if (this.has(nodePath)) {
      const metadata = this.metadata.get(nodePath);
      const { navNodeInfo } = await this.graphQLService.sdk.navNodeInfo({
        nodePath,
        withDetails: metadata.withDetails,
        withFilters: false,
      });

      return this.navNodeInfoToNavNode(navNodeInfo);
    } else {
      return await this.loadNodeParents(nodePath);
    }
  }

  async loadNodeParents(nodePath: string): Promise<NavNode> {
    const metadata = this.metadata.get(nodePath);
    const { node, parents } = await this.graphQLService.sdk.getNodeParents({
      nodePath,
      withDetails: metadata.withDetails,
      withFilters: false,
    });

    return runInAction(() => {
      const navNode = this.navNodeInfoToNavNode(node, parents[0]?.id);

      this.set(resourceKeyList([...parents.map(node => node.id), navNode.id]), [
        ...parents.reduce((list, node, index, array) => {
          list.push(this.navNodeInfoToNavNode(node, array[index + 1]?.id));
          return list;
        }, [] as NavNode[]),
        navNode,
      ]);
      return navNode;
    });
  }

  protected override getDefaultMetadata(key: string, metadata: MetadataMap<string, INodeMetadata>): INodeMetadata {
    return Object.assign(super.getDefaultMetadata(key, metadata), {
      withDetails: false,
    });
  }

  protected override dataSet(key: string, value: NavNode): void {
    const currentValue = this.dataGet(key);
    super.dataSet(key, Object.assign(currentValue ?? {}, value));
  }

  protected validateKey(key: string): boolean {
    return typeof key === 'string';
  }
}

export function getNodeDisplayName(node: NavNode): string {
  return node.name ?? node.id;
}

export function getNodePlainName(node: NavNode): string {
  return node.plainName ?? getNodeDisplayName(node);
}
