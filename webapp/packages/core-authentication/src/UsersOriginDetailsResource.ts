/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import {
  CACHED_RESOURCE_DEFAULT_PAGE_LIMIT,
  CACHED_RESOURCE_DEFAULT_PAGE_OFFSET,
  CachedMapAllKey,
  CachedMapResource,
  CachedResourceOffsetPageKey,
  CachedResourceOffsetPageListKey,
  isResourceAlias,
  ResourceKey,
  resourceKeyList,
  ResourceKeyUtils,
} from '@cloudbeaver/core-resource';
import { AdminOriginDetailsFragment, GraphQLService } from '@cloudbeaver/core-sdk';

import { UsersResource, UsersResourceFilterKey } from './UsersResource';

@injectable()
export class UsersOriginDetailsResource extends CachedMapResource<string, AdminOriginDetailsFragment> {
  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly usersResource: UsersResource,
  ) {
    super();

    this.sync(this.usersResource);
  }

  protected async loader(originalKey: ResourceKey<string>): Promise<Map<string, AdminOriginDetailsFragment>> {
    const all = this.aliases.isAlias(originalKey, CachedMapAllKey);
    const keys: string[] = [];

    if (all) {
      throw new Error('Loading all users is prohibited');
    }

    const userMetaParametersList: AdminOriginDetailsFragment[] = [];

    await ResourceKeyUtils.forEachAsync(originalKey, async key => {
      let userId: string | undefined;

      if (!isResourceAlias(key)) {
        userId = key;
      }

      if (userId !== undefined) {
        const { user } = await this.graphQLService.sdk.getAdminUserOriginDetails({
          userId,
        });

        keys.push(userId);
        userMetaParametersList.push(user);
      } else {
        const pageKey =
          this.aliases.isAlias(originalKey, CachedResourceOffsetPageKey) || this.aliases.isAlias(originalKey, CachedResourceOffsetPageListKey);
        const filterKey = this.aliases.isAlias(originalKey, UsersResourceFilterKey);
        let offset = CACHED_RESOURCE_DEFAULT_PAGE_OFFSET;
        let limit = CACHED_RESOURCE_DEFAULT_PAGE_LIMIT;
        let userIdMask: string | undefined;
        let enabledState: boolean | undefined;

        if (pageKey) {
          offset = pageKey.options.offset;
          limit = pageKey.options.limit;
        }

        if (filterKey) {
          userIdMask = filterKey.options.userId;
          enabledState = filterKey.options.enabledState;
        }

        const { users } = await this.graphQLService.sdk.getUsersOriginDetailsList({
          page: {
            offset,
            limit,
          },
          filter: {
            userIdMask,
            enabledState,
          },
        });

        userMetaParametersList.push(...users);
        keys.push(...users.map(user => user.userId));

        this.offsetPagination.setPageEnd(CachedResourceOffsetPageListKey(offset, users.length).setTarget(filterKey), users.length === limit);
      }
    });

    this.set(resourceKeyList(keys), userMetaParametersList);

    return this.data;
  }

  protected validateKey(key: string): boolean {
    return typeof key === 'string';
  }
}
