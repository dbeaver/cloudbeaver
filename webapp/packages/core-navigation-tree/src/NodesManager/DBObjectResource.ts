/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { runInAction } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { ExecutorInterrupter } from '@cloudbeaver/core-executor';
import {
  CACHED_RESOURCE_DEFAULT_PAGE_OFFSET,
  CachedMapResource,
  CachedResourcePageKey,
  CachedResourcePageListKey,
  DetailsError,
  GraphQLService,
  isResourceAlias,
  ResourceKey,
  resourceKeyList,
  resourceKeyListAliasFactory,
  ResourceKeyUtils,
} from '@cloudbeaver/core-sdk';

import type { DBObject } from './EntityTypes';
import { NavNodeInfoResource } from './NavNodeInfoResource';
import { NavTreeResource } from './NavTreeResource';

export const DBObjectParentKey = resourceKeyListAliasFactory('@db-object/parent', (parentId: string) => ({ parentId }));

@injectable()
export class DBObjectResource extends CachedMapResource<string, DBObject> {
  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly navNodeInfoResource: NavNodeInfoResource,
    private readonly navTreeResource: NavTreeResource,
  ) {
    super();

    this.addAlias(DBObjectParentKey, param => resourceKeyList(navTreeResource.get(param.options.parentId) || []));
    // this.preloadResource(this.navNodeInfoResource);
    this.navNodeInfoResource.outdateResource(this);
    this.navNodeInfoResource.deleteInResource(this);

    this.navTreeResource.onDataOutdated.addHandler(key => {
      ResourceKeyUtils.forEach(key, nodeId => {
        const pageAlias = this.isAlias(nodeId, CachedResourcePageKey) || this.isAlias(nodeId, CachedResourcePageListKey);

        if (pageAlias) {
          this.markOutdated(DBObjectParentKey(pageAlias.target));
        }

        if (!isResourceAlias(nodeId)) {
          this.markOutdated(DBObjectParentKey(nodeId));
        }
      });
    });

    this.beforeLoad.addHandler(async (originalKey, context) => {
      await this.navTreeResource.waitLoad();
      const parentKey = this.isAlias(originalKey, DBObjectParentKey);
      const pageKey = this.isAlias(originalKey, CachedResourcePageKey) || this.isAlias(originalKey, CachedResourcePageListKey);
      let limit = this.navTreeResource.childrenLimit;
      let offset = CACHED_RESOURCE_DEFAULT_PAGE_OFFSET;

      if (pageKey) {
        limit = pageKey.options.limit;
        offset = pageKey.options.offset;
      }

      if (parentKey) {
        await this.navTreeResource.load(CachedResourcePageKey(offset, limit).setTarget(parentKey.options.parentId));
        return;
      }

      const key = ResourceKeyUtils.toList(this.transformToKey(originalKey));
      const parents = [
        ...new Set(
          key.map(nodeId => this.navNodeInfoResource.get(nodeId)?.parentId).filter<string>((nodeId): nodeId is string => nodeId !== undefined),
        ),
      ];

      await this.navTreeResource.load(resourceKeyList(parents));

      if (key.length > 0 && !navNodeInfoResource.has(key)) {
        ExecutorInterrupter.interrupt(context);
        const cause = new DetailsError(`Entity not found: ${key.toString()}`);
        throw this.markError(cause, key);
      }
    });
  }

  protected async loader(originalKey: ResourceKey<string>): Promise<Map<string, DBObject>> {
    let limit = this.navTreeResource.childrenLimit;
    let offset = CACHED_RESOURCE_DEFAULT_PAGE_OFFSET;
    const parentKey = this.isAlias(originalKey, DBObjectParentKey);
    const pageKey = this.isAlias(originalKey, CachedResourcePageKey) || this.isAlias(originalKey, CachedResourcePageListKey);

    if (pageKey) {
      limit = pageKey.options.limit;
      offset = pageKey.options.offset;
    }

    if (parentKey) {
      const nodeId = parentKey.options.parentId;
      await this.loadFromChildren(nodeId, offset, limit);

      runInAction(() => {
        this.setPageEnd(
          CachedResourcePageKey(offset, limit).setTarget(originalKey),
          this.navTreeResource.hasNextPage(CachedResourcePageKey(offset, limit).setTarget(nodeId)),
        );
      });
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
