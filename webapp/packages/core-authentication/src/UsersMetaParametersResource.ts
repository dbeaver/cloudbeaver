/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { CachedMapAllKey, CachedMapResource, isResourceAlias, type ResourceKey, resourceKeyList, ResourceKeyUtils } from '@cloudbeaver/core-resource';
import { GraphQLService } from '@cloudbeaver/core-sdk';

import type { UserMetaParameter } from './UserMetaParametersResource.js';
import { UsersResource } from './UsersResource.js';

@injectable()
export class UsersMetaParametersResource extends CachedMapResource<string, UserMetaParameter> {
  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly usersResource: UsersResource,
  ) {
    super();

    this.sync(this.usersResource);
    this.usersResource.onItemDelete.addHandler(this.delete.bind(this));
  }

  async setMetaParameters(userId: string, parameters: Record<string, any>): Promise<void> {
    await this.performUpdate(userId, undefined, async () => {
      await this.graphQLService.sdk.saveUserMetaParameters({ userId, parameters });

      if (this.data) {
        this.data.set(userId, parameters as UserMetaParameter);
      }
    });
  }

  protected async loader(originalKey: ResourceKey<string>): Promise<Map<string, UserMetaParameter>> {
    const all = this.aliases.isAlias(originalKey, CachedMapAllKey);
    const keys = resourceKeyList<string>([]);

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
      }
    });

    this.set(keys, userMetaParametersList);

    return this.data;
  }

  protected validateKey(key: string): boolean {
    return typeof key === 'string';
  }
}
