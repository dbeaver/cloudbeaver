/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, makeObservable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import {
  GraphQLService,
  CachedMapResource,
  ResourceKey,
  isResourceKeyList,
  NavNodeInfoFragment,
  ResourceKeyUtils,
  ICachedMapResourceMetadata,
  ResourceKeyList,
  resourceKeyList
} from '@cloudbeaver/core-sdk';
import { MetadataMap } from '@cloudbeaver/core-utils';

import type { NavNode } from './EntityTypes';

type NavNodeInfo = NavNodeInfoFragment;

export const ROOT_NODE_PATH = '';

interface INodeMetadata extends ICachedMapResourceMetadata {
  withDetails: boolean;
}

@injectable()
export class NavNodeInfoResource extends CachedMapResource<string, NavNode> {
  protected metadata: MetadataMap<string, INodeMetadata>;
  constructor(private readonly graphQLService: GraphQLService) {
    super();

    makeObservable(this, {
      setDetails: action,
      updateNode: action,
      setParent: action,
    });

    this.metadata = new MetadataMap<string, INodeMetadata>(() => ({
      outdated: true,
      loading: false,
      withDetails: false,
      exception: null,
      includes: [],
    }));
  }

  updateNode(key: string, node: NavNode): void;
  updateNode(key: ResourceKeyList<string>, nodes: NavNode[]): void;
  updateNode(key: ResourceKey<string>, nodes: NavNode[] | NavNode): void;
  updateNode(key: ResourceKey<string>, nodes: NavNode[] | NavNode): void {
    const keyList: string[] = [];
    const values: NavNode[] = [];

    ResourceKeyUtils.forEach(key, (key, i) => {
      const value = i === -1 ? (nodes as NavNode) : (nodes as NavNode[])[i];
      const currentValue = this.get(key);

      if (currentValue && value) {
        Object.assign(currentValue, value);
      } else {
        keyList.push(key);
        values.push(value);
      }
    });

    if (keyList.length > 0) {
      this.set(resourceKeyList(keyList), values);
    }
    this.markUpdated(key);
    this.onItemAdd.execute(key);
  }

  setDetails(keyObject: ResourceKey<string>, state: boolean): void {
    ResourceKeyUtils.forEach(keyObject, key => {
      const metadata = this.metadata.get(key);

      if (metadata.withDetails !== state) {
        metadata.outdated = true;
      }
      metadata.withDetails = state;
    });
  }

  setParent(key: string, parentId: string): void;
  setParent(key: ResourceKeyList<string>, parentId: string): void;
  setParent(key: ResourceKey<string>, parentId: string): void;
  setParent(key: ResourceKey<string>, parentId: string): void {
    ResourceKeyUtils.forEach(key, key => {
      const node = this.get(key);

      if (node) {
        node.parentId = parentId;
      }
    });
  }

  protected async loader(key: ResourceKey<string>): Promise<Map<string, NavNode>> {
    if (isResourceKeyList(key)) {
      const values: NavNode[] = [];
      for (const nodePath of key.list) {
        values.push(await this.loadNodeInfo(nodePath));
      }
      this.set(key, values);
    } else {
      this.set(key, await this.loadNodeInfo(key));
    }

    return this.data;
  }

  navNodeInfoToNavNode(node: NavNodeInfo, parentId?: string): NavNode {
    return {
      ...node,
      objectFeatures: node.object?.features || [],
      parentId: parentId || this.get(node.id)?.parentId || ROOT_NODE_PATH,
    };
  }

  async loadNodeFullName(nodePath: string): Promise<NavNode> {
    const node = await this.load(nodePath);
    const { navNodeInfo } = await this.graphQLService.sdk.getNavNodeFullName({
      nodePath,
    });

    node.fullName = navNodeInfo.fullName;

    return node;
  }

  private async loadNodeInfo(nodePath: string): Promise<NavNode> {
    const metadata = this.metadata.get(nodePath);
    const { navNodeInfo } = await this.graphQLService.sdk.navNodeInfo({
      nodePath,
      withDetails: metadata.withDetails,
    });

    return this.navNodeInfoToNavNode(navNodeInfo);
  }
}

export function getNodeName(node: NavNode): string {
  return `${node.nodeType || 'Object'}${node.name ? ' (' + node.name + ')' : ''}`;
}
