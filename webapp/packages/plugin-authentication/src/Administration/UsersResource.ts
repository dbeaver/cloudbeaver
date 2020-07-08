/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import {
  GraphQLService,
  CachedDataResource,
  AdminUserInfo
} from '@cloudbeaver/core-sdk';

@injectable()
export class UsersResource extends CachedDataResource<AdminUserInfo[], string | undefined> {
  constructor(
    private graphQLService: GraphQLService,
  ) {
    super([]);
  }

  isLoaded(userId?: string) {
    return userId
      ? this.data.some(role => role.userId === userId)
      : !!this.data.length;
  }

  protected async loader(userId?: string): Promise<AdminUserInfo[]> {
    const { users } = await this.graphQLService.gql.getUsersList({ userId });

    if (!userId) {
      return users as AdminUserInfo[];
    }

    const index = this.data.findIndex(user => user.userId === userId);
    if (index !== -1) {
      this.data.splice(index, 1, ...users as AdminUserInfo[]);
    } else {
      this.data.push(...users as AdminUserInfo[]);
    }

    return this.data;
  }
}
