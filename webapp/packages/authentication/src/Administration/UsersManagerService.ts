/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@dbeaver/core/di';
import { CachedResource, GraphQLService, AdminUserInfo } from '@dbeaver/core/sdk';

@injectable()
export class UsersManagerService {
  readonly users = new CachedResource([], this.refreshAsync.bind(this), data => !!data.length)
  constructor(
    private graphQLService: GraphQLService
  ) {
  }

  private async refreshAsync(data: AdminUserInfo[]): Promise<AdminUserInfo[]> {
    const { users } = await this.graphQLService.gql.getUsersList();

    // TODO: temporary before full implementation was provided
    return users as AdminUserInfo[];
  }
}
