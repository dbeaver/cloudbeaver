/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, computed, observable } from 'mobx';

import { type IServiceConstructor, useService } from '@cloudbeaver/core-di';
import {
  CACHED_RESOURCE_DEFAULT_PAGE_LIMIT,
  CACHED_RESOURCE_DEFAULT_PAGE_OFFSET,
  CachedMapResource,
  CachedResourceOffsetPageKey,
  CachedResourceOffsetPageListKey,
  CachedResourceOffsetPageTargetKey,
  getNextPageOffset,
  type ICachedResourceOffsetPageOptions,
  isResourceAlias,
  type ResourceKey,
  ResourceKeyAlias,
  ResourceKeyList,
  ResourceKeyListAlias,
} from '@cloudbeaver/core-resource';

import { useObservableRef } from '../useObservableRef.js';

interface IOptions<TKey extends ResourceKey<any>> {
  key: TKey;
  pageSize?: number;
}

interface IOffsetPagination<TKey> {
  currentPage: TKey extends ResourceKeyListAlias<any, any> | ResourceKeyList<any>
    ? ResourceKeyListAlias<any, Readonly<ICachedResourceOffsetPageOptions>>
    : ResourceKeyAlias<any, Readonly<ICachedResourceOffsetPageOptions>>;
  allPages: TKey extends ResourceKeyListAlias<any, any> | ResourceKeyList<any>
    ? ResourceKeyListAlias<any, Readonly<ICachedResourceOffsetPageOptions>>
    : ResourceKeyAlias<any, Readonly<ICachedResourceOffsetPageOptions>>;
  hasNextPage: boolean;
  refresh: () => void;
  loadMore: () => void;
}

interface IOffsetPaginationPrivate<TKey extends ResourceKey<any>> extends IOffsetPagination<TKey> {
  offset: number;
  resource: CachedMapResource<any, any, any, any>;
  _key: ResourceKeyAlias<any, Readonly<ICachedResourceOffsetPageOptions>> | ResourceKeyListAlias<any, Readonly<ICachedResourceOffsetPageOptions>>;
  _target: TKey | undefined;
}

export function useOffsetPagination<TResource extends CachedMapResource<any, any, any, any>, TKey extends ResourceKey<any>>(
  ctor: IServiceConstructor<TResource>,
  options?: IOptions<TKey>,
): IOffsetPagination<TKey> {
  const targetKey = options?.key;
  const pageSize = options?.pageSize || CACHED_RESOURCE_DEFAULT_PAGE_LIMIT;
  const resource = useService(ctor);
  const pageInfo = resource.offsetPagination.getPageInfo(createPageKey(0, 0, targetKey));
  const offset = Math.max(
    (pageInfo ? getNextPageOffset(pageInfo) : CACHED_RESOURCE_DEFAULT_PAGE_OFFSET) - (pageInfo?.end ?? pageSize),
    CACHED_RESOURCE_DEFAULT_PAGE_OFFSET,
  );

  const pagination = useObservableRef<IOffsetPaginationPrivate<TKey>>(
    () => ({
      offset,
      _key: createPageKey(offset, pageSize, targetKey),
      _target: targetKey,
      get currentPage() {
        for (let i = 0; i < this.offset; i += this._key.options.limit) {
          const key = createPageKey(i, this._key.options.limit, this._target);
          if (resource.isOutdated(key)) {
            return key;
          }
        }

        return this._key as any;
      },
      get allPages(): any {
        return createPageKey(0, this._key.options.offset + this._key.options.limit, this._target);
      },
      get hasNextPage(): boolean {
        return this.resource.offsetPagination.hasNextPage(this._key);
      },
      loadMore() {
        if (this.hasNextPage) {
          this._key = createPageKey(this.offset + this._key.options.limit, this._key.options.limit, this._target);
        }
      },
      refresh() {
        this.resource.markOutdated(this._target);
      },
    }),
    {
      _key: observable.ref,
      offset: observable.ref,
      currentPage: computed,
      allPages: computed,
      hasNextPage: computed,
      loadMore: action.bound,
      refresh: action.bound,
    },
    { resource, offset },
  );

  if (!resource.isIntersect(targetKey, pagination._target)) {
    pagination._key = createPageKey(offset, pageSize, targetKey);
    pagination._target = targetKey;
  }

  return pagination;
}

function createPageKey(
  offset: number,
  limit: number,
  next: ResourceKey<any>,
): ResourceKeyAlias<any, Readonly<ICachedResourceOffsetPageOptions>> | ResourceKeyListAlias<any, Readonly<ICachedResourceOffsetPageOptions>> {
  const parent = isResourceAlias(next) ? next : CachedResourceOffsetPageTargetKey(next);
  if (next instanceof ResourceKeyList || next instanceof ResourceKeyListAlias) {
    return CachedResourceOffsetPageListKey(offset, limit).setParent(parent);
  }
  return CachedResourceOffsetPageKey(offset, limit).setParent(parent);
}
