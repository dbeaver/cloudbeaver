/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { CachedMapAllKey, CachedMapResource, isResourceAlias, type ResourceKey, resourceKeyList, ResourceKeyUtils } from '@cloudbeaver/core-resource';
import { type AdminOriginDetailsFragment, GraphQLService } from '@cloudbeaver/core-sdk';

import { UsersResource } from './UsersResource.js';

@injectable()
export class UsersOriginDetailsResource extends CachedMapResource<string, AdminOriginDetailsFragment> {
  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly usersResource: UsersResource,
  ) {
    super();

    this.sync(this.usersResource);
    this.usersResource.onItemDelete.addHandler(this.delete.bind(this));
  }

  protected async loader(originalKey: ResourceKey<string>): Promise<Map<string, AdminOriginDetailsFragment>> {
    const all = this.aliases.isAlias(originalKey, CachedMapAllKey);
    const keys = resourceKeyList<string>([]);

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
      }
    });

    this.set(keys, userMetaParametersList);

    return this.data;
  }

  protected validateKey(key: string): boolean {
    return typeof key === 'string';
  }
}
