/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { ExecutorInterrupter } from '@cloudbeaver/core-executor';
import { GraphQLService, CachedMapResource, ResourceKey, resourceKeyList, ResourceKeyUtils, DetailsError, isResourceAlias, resourceKeyListAliasFactory } from '@cloudbeaver/core-sdk';

import type { DBObject } from './EntityTypes';
import { NavNodeInfoResource } from './NavNodeInfoResource';
import { NavTreeResource } from './NavTreeResource';

export const DBObjectParentKey = resourceKeyListAliasFactory(
  '@db-object/parent',
  (parentId: string) => ({ parentId })
);

@injectable()
export class DBObjectResource extends CachedMapResource<string, DBObject> {
  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly navNodeInfoResource: NavNodeInfoResource,
    private readonly navTreeResource: NavTreeResource
  ) {
    super();

    this.addAlias(
      DBObjectParentKey,
      param => resourceKeyList(navTreeResource.get(param.options.parentId) || [])
    );
    // this.preloadResource(this.navNodeInfoResource);
    this.navNodeInfoResource.outdateResource(this);
    this.navNodeInfoResource.deleteInResource(this);
    this.beforeLoad.addHandler(async (originalKey, context) => {
      await this.navTreeResource.waitLoad();
      if (this.isAlias(originalKey, DBObjectParentKey)) {
        await this.navTreeResource.load(originalKey.options.parentId);
        return;
      }

      const key = ResourceKeyUtils.toList(this.transformToKey(originalKey));
      const parents = [...new Set(
        key.map(nodeId => this.navNodeInfoResource.get(nodeId)?.parentId)
          .filter<string>((nodeId): nodeId is string => nodeId !== undefined)
      )];

      await this.navTreeResource.load(resourceKeyList(parents));

      if (key.length > 0 && !navNodeInfoResource.has(key)) {
        ExecutorInterrupter.interrupt(context);
        const cause = new DetailsError(`Entity not found: ${key.toString()}`);
        throw this.markError(cause, key);
      }
    });
  }

  protected async loader(originalKey: ResourceKey<string>): Promise<Map<string, DBObject>> {
    if (this.isAlias(originalKey, DBObjectParentKey)) {
      await this.loadFromChildren(originalKey.options.parentId, 0, this.navTreeResource.childrenLimit + 1);
      return this.data;
    }

    if (!isResourceAlias(originalKey)) {
      const values: DBObject[] = [];
      originalKey = ResourceKeyUtils.toList(originalKey);
      await ResourceKeyUtils.forEachAsync(originalKey, async navNodeId => {
        values.push(await this.loadDBObjectInfo(navNodeId));
      });
      this.set(originalKey, values);
    }

    return this.data;
  }

  private async loadFromChildren(parentId: string, offset: number, limit: number) {
    const { dbObjects } = await this.graphQLService.sdk.getChildrenDBObjectInfo({
      navNodeId: parentId,
      offset,
      limit,
    });

    this.set(resourceKeyList(dbObjects.map(dbObject => dbObject.id)), dbObjects);
  }

  private async loadDBObjectInfo(navNodeId: string): Promise<DBObject> {
    const { objectInfo } = await this.graphQLService.sdk.getDBObjectInfo({
      navNodeId,
    });

    return objectInfo;
  }

  protected validateKey(key: string): boolean {
    return typeof key === 'string';
  }
}
