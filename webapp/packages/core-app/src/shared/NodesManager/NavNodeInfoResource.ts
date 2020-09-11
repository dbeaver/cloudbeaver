/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import {
  GraphQLService, CachedMapResource, ResourceKey, isResourceKeyList, NavigatorNodeInfo, DatabaseObjectInfo
} from '@cloudbeaver/core-sdk';

import { NavNode } from './EntityTypes';

type NavNodeInfo = Pick<NavigatorNodeInfo, 'id' | 'name' | 'hasChildren' | 'nodeType' | 'icon' | 'folder' | 'inline' | 'navigable' | 'features'>
& { object?: Pick<DatabaseObjectInfo, 'features'> };

export const ROOT_NODE_PATH = '';

@injectable()
export class NavNodeInfoResource extends CachedMapResource<string, NavNode> {
  constructor(private graphQLService: GraphQLService) {
    super(new Map());
  }

  protected async loader(key: ResourceKey<string>) {
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
    const { navNodeInfo } = await this.graphQLService.sdk.navNodeInfo({
      nodePath,
    });

    return this.navNodeInfoToNavNode(navNodeInfo);
  }
}
