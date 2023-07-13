/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, computed, observable } from 'mobx';

import { type IServiceConstructor, useService } from '@cloudbeaver/core-di';
import { CachedMapPageKey, CachedMapResource, ICachedMapPageOptions, ResourceKeyListAlias } from '@cloudbeaver/core-sdk';
import { isArraysEqual } from '@cloudbeaver/core-utils';

import { useObservableRef } from '../useObservableRef';

interface IOptions {
  pageSize?: number;
  getKey?: (first: number, after?: any) => ResourceKeyListAlias<any, Readonly<ICachedMapPageOptions>>;
  dependencies: any[];
}

interface IPagination {
  after: any;
  key: ResourceKeyListAlias<any, any>;
  hasNextPage: boolean;
  loaded: ResourceKeyListAlias<any, any>[];
  refresh: () => void;
  loadMore: () => void;
}

interface IPaginationPrivate extends IPagination {
  pageSize: number;
  resource: CachedMapResource<any, any, any, any>;
  dependencies: any[];
  reset(): void;
}

export function usePagination<TResource extends CachedMapResource<any, any, any, any>>(
  ctor: IServiceConstructor<TResource>,
  options?: IOptions,
): IPagination {
  const pageSize = options?.pageSize || 100;
  const resource = useService(ctor);

  const pagination = useObservableRef<IPaginationPrivate>(
    () => {
      const key = options?.getKey?.(pageSize) || CachedMapPageKey(pageSize);
      const dependencies = options?.dependencies || [];
      const after = null;

      return {
        after,
        key,
        dependencies,
        get hasNextPage(): boolean {
          return this.resource.getPageInfo(this.key)?.hasNextPage || false;
        },
        loaded: [key],
        loadMore() {
          const pageInfo = this.resource.getPageInfo(this.key);

          if (pageInfo?.hasNextPage) {
            if (pageInfo.endCursor) {
              this.after = pageInfo.endCursor;
              this.key = options?.getKey?.(this.pageSize, this.after) || CachedMapPageKey(this.pageSize, this.after);
              this.loaded.push(this.key);
            }
          }
        },
        refresh() {
          for (const key of this.loaded) {
            this.resource.markOutdated(key);
          }
          this.reset();
        },
        reset() {
          this.after = null;
          this.key = options?.getKey?.(this.pageSize) || CachedMapPageKey(this.pageSize);
          this.loaded = [this.key];
        },
      };
    },
    {
      after: observable.ref,
      key: observable.ref,
      loaded: observable.shallow,
      hasNextPage: computed,
      loadMore: action.bound,
      reset: action.bound,
      refresh: action.bound,
    },
    { pageSize, resource },
  );

  if (!isArraysEqual(pagination.dependencies, options?.dependencies || [])) {
    pagination.dependencies = options?.dependencies || [];

    pagination.reset();
  }

  return pagination;
}
