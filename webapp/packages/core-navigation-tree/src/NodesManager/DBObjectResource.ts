/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
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
  CachedResourceOffsetPageKey,
  CachedResourceOffsetPageListKey,
  CachedResourceOffsetPageTargetKey,
  getOffsetPageKeyInfo,
  isResourceAlias,
  type ResourceKey,
  resourceKeyList,
  resourceKeyListAliasFactory,
  ResourceKeyUtils,
} from '@cloudbeaver/core-resource';
import { DetailsError, GraphQLService } from '@cloudbeaver/core-sdk';

import type { DBObject } from './EntityTypes.js';
import { NavNodeInfoResource } from './NavNodeInfoResource.js';
import { NavTreeResource } from './NavTreeResource.js';

export const DBObjectParentKey = resourceKeyListAliasFactory('@db-object/parent', (parentId: string) => ({ parentId }));

@injectable()
export class DBObjectResource extends CachedMapResource<string, DBObject> {
  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly navNodeInfoResource: NavNodeInfoResource,
    private readonly navTreeResource: NavTreeResource,
  ) {
    super();

    this.aliases.add(DBObjectParentKey, param => resourceKeyList(navTreeResource.get(param.options.parentId) || []));
    // this.preloadResource(this.navNodeInfoResource);
    this.navNodeInfoResource.outdateResource(this);
    this.navNodeInfoResource.deleteInResource(this);

    this.navTreeResource.onDataOutdated.addHandler(key => {
      ResourceKeyUtils.forEach(key, nodeId => {
        const pageAlias = this.aliases.isAlias(nodeId, CachedResourceOffsetPageKey) || this.aliases.isAlias(nodeId, CachedResourceOffsetPageListKey);

        if (pageAlias) {
          const pageTarget = this.aliases.isAlias(nodeId, CachedResourceOffsetPageTargetKey);
          this.markOutdated(DBObjectParentKey(pageTarget?.options.target));
        }

        if (!isResourceAlias(nodeId)) {
          this.markOutdated(DBObjectParentKey(nodeId));
        }
      });
    });

    this.beforeLoad.addHandler(async (originalKey, context) => {
      const parentKey = this.aliases.isAlias(originalKey, DBObjectParentKey);
      const pageKey =
        this.aliases.isAlias(originalKey, CachedResourceOffsetPageKey) || this.aliases.isAlias(originalKey, CachedResourceOffsetPageListKey);
      let limit = this.navTreeResource.childrenLimit;
      let offset = CACHED_RESOURCE_DEFAULT_PAGE_OFFSET;

      if (pageKey) {
        limit = pageKey.options.limit;
        offset = pageKey.options.offset;
      }

      if (parentKey) {
        await this.navTreeResource.load(
          CachedResourceOffsetPageKey(offset, limit).setParent(CachedResourceOffsetPageTargetKey(parentKey.options.parentId)),
        );
        return;
      }

      const key = ResourceKeyUtils.toList(this.aliases.transformToKey(originalKey));

      for (const nodeId of key) {
        const preloaded = await this.navTreeResource.preloadParents(nodeId);

        if (!preloaded) {
          throw new DetailsError('Not found: ' + nodeId);
        }
      }

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
    const parentKey = this.aliases.isAlias(originalKey, DBObjectParentKey);
    const { isPageListKey, offset, limit } = getOffsetPageKeyInfo(this, originalKey, undefined, this.navTreeResource.childrenLimit);

    if (parentKey) {
      const nodeId = parentKey.options.parentId;
      const dbObjects = await this.loadFromChildren(nodeId, offset, limit);

      runInAction(() => {
        const keys = dbObjects.map(dbObject => dbObject.id);
        this.set(resourceKeyList(keys), dbObjects);

        this.offsetPagination.setPage(
          isPageListKey
            ? CachedResourceOffsetPageListKey(offset, keys.length).setParent(parentKey || CachedResourceOffsetPageTargetKey(nodeId))
            : CachedResourceOffsetPageKey(offset, keys.length).setParent(parentKey || CachedResourceOffsetPageTargetKey(nodeId)),
          keys,
          keys.length === limit,
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

  private async loadFromChildren(parentId: string, offset: number, limit: number): Promise<DBObject[]> {
    const { dbObjects } = await this.graphQLService.sdk.getChildrenDBObjectInfo({
      navNodeId: parentId,
      offset,
      limit,
    });

    return dbObjects;
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
