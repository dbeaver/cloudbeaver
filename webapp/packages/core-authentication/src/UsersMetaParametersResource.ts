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
import { GraphQLService } from '@cloudbeaver/core-sdk';

import type { UserMetaParameter } from './UserMetaParametersResource';
import { UsersResource, UsersResourceFilterKey } from './UsersResource';

@injectable()
export class UsersMetaParametersResource extends CachedMapResource<string, UserMetaParameter> {
  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly usersResource: UsersResource,
  ) {
    super();

    this.sync(this.usersResource);
  }

  async setMetaParameters(userId: string, parameters: Record<string, any>): Promise<void> {
    await this.graphQLService.sdk.saveUserMetaParameters({ userId, parameters });
    this.markOutdated(userId);
  }

  protected async loader(originalKey: ResourceKey<string>): Promise<Map<string, UserMetaParameter>> {
    const all = this.aliases.isAlias(originalKey, CachedMapAllKey);
    const keys: string[] = [];

    if (all) {
      throw new Error('Loading all users is prohibited');
    }

    const userMetaParametersList: UserMetaParameter[] = [];

    await ResourceKeyUtils.forEachAsync(originalKey, async key => {
      let userId: string | undefined;

      if (!isResourceAlias(key)) {
        userId = key;
      }

      if (userId !== undefined) {
        const { user } = await this.graphQLService.sdk.getAdminUserMetaParameters({
          userId,
        });

        keys.push(userId);
        userMetaParametersList.push(user.metaParameters);
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

        const { users } = await this.graphQLService.sdk.getUsersMetaParametersList({
          page: {
            offset,
            limit,
          },
          filter: {
            userIdMask,
            enabledState,
          },
        });

        userMetaParametersList.push(...users.map(user => user.metaParameters));
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
