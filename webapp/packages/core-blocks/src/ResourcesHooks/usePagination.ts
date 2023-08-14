/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
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
  CachedResourcePageKey,
  CachedResourcePageListKey,
  getNextPageOffset,
  ICachedResourcePageOptions,
  ResourceKey,
  ResourceKeyAlias,
  ResourceKeyList,
  ResourceKeyListAlias,
} from '@cloudbeaver/core-sdk';

import { useObservableRef } from '../useObservableRef';

interface IOptions<TKey extends ResourceKey<any>> {
  key: TKey;
  pageSize?: number;
}

interface IPagination<TKey> {
  key: TKey extends ResourceKeyListAlias<any, any> | ResourceKeyList<any>
    ? ResourceKeyListAlias<any, Readonly<ICachedResourcePageOptions>>
    : ResourceKeyAlias<any, Readonly<ICachedResourcePageOptions>>;
  hasNextPage: boolean;
  refresh: () => void;
  loadMore: () => void;
}

interface IPaginationPrivate<TKey extends ResourceKey<any>> extends IPagination<TKey> {
  offset: number;
  resource: CachedMapResource<any, any, any, any>;
  _key: ResourceKeyAlias<any, Readonly<ICachedResourcePageOptions>> | ResourceKeyListAlias<any, Readonly<ICachedResourcePageOptions>>;
}

export function usePagination<TResource extends CachedMapResource<any, any, any, any>, TKey extends ResourceKey<any>>(
  ctor: IServiceConstructor<TResource>,
  options?: IOptions<TKey>,
): IPagination<TKey> {
  const targetKey = options?.key;
  const pageSize = options?.pageSize || CACHED_RESOURCE_DEFAULT_PAGE_LIMIT;
  const resource = useService(ctor);
  const pageInfo = resource.getPageInfo(createPageKey(0, 0, targetKey));
  const offset = Math.max(
    (pageInfo ? getNextPageOffset(pageInfo) : CACHED_RESOURCE_DEFAULT_PAGE_OFFSET) - pageSize,
    CACHED_RESOURCE_DEFAULT_PAGE_OFFSET,
  );

  const pagination = useObservableRef<IPaginationPrivate<TKey>>(
    () => ({
      offset,
      _key: createPageKey(offset, pageSize, targetKey),
      get key() {
        const pageInfo = resource.getPageInfo(createPageKey(0, 0, this._key.target));

        for (const page of pageInfo?.pages || []) {
          if (page.outdated && page.from < this._key.options.offset) {
            return createPageKey(page.from, this._key.options.limit, this._key.target);
          }
        }
        return this._key as any;
      },
      get hasNextPage(): boolean {
        return this.resource.hasNextPage(this._key);
      },
      loadMore() {
        if (this.hasNextPage) {
          this._key = createPageKey(this._key.options.offset + this._key.options.limit, this._key.options.limit, this._key.target);
        }
      },
      refresh() {
        this.resource.markOutdated(this._key.target);
      },
    }),
    {
      _key: observable.ref,
      key: computed,
      hasNextPage: computed,
      loadMore: action.bound,
      refresh: action.bound,
    },
    { resource },
  );

  if (!resource.isIntersect(targetKey, pagination._key.target)) {
    pagination._key = createPageKey(offset, pageSize, targetKey);
  }

  return pagination;
}

function createPageKey(
  offset: number,
  limit: number,
  target: ResourceKey<any>,
): ResourceKeyAlias<any, Readonly<ICachedResourcePageOptions>> | ResourceKeyListAlias<any, Readonly<ICachedResourcePageOptions>> {
  if (target instanceof ResourceKeyList || target instanceof ResourceKeyListAlias) {
    return CachedResourcePageListKey(offset, limit).setTarget(target);
  }
  return CachedResourcePageKey(offset, limit).setTarget(target);
}
