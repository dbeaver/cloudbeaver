/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
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
  ICachedMapResourceMetadata
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
  constructor(private graphQLService: GraphQLService) {
    super();

    makeObservable(this, {
      setDetails: action,
    });

    this.metadata = new MetadataMap<string, INodeMetadata>(() => ({
      outdated: true,
      loading: false,
      withDetails: false,
      exception: null,
      includes: [],
    }));
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

  private async loadNodeInfo(nodePath: string): Promise<NavNode> {
    const metadata = this.metadata.get(nodePath);
    const { navNodeInfo } = await this.graphQLService.sdk.navNodeInfo({
      nodePath,
      withDetails: metadata.withDetails,
    });

    return this.navNodeInfoToNavNode(navNodeInfo);
  }
}
