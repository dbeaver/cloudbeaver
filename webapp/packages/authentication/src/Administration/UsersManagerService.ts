/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@dbeaver/core/di';
import { CachedResource, GraphQLService, AdminUserInfo } from '@dbeaver/core/sdk';

import { AuthProviderService } from '../AuthProviderService';

@injectable()
export class UsersManagerService {
  readonly users = new CachedResource([], this.refreshAsync.bind(this), data => !!data.length)
  constructor(
    private graphQLService: GraphQLService,
    private authProviderService: AuthProviderService,
  ) {
  }

  async create(userId: string): Promise<AdminUserInfo> {
    const { user } = await this.graphQLService.gql.createUser({ userId });

    // TODO: maybe better to do refresh
    this.users.data.push(user as AdminUserInfo);
    return user as AdminUserInfo;
  }

  async grantRole(userId: string, roleId: string) {
    await this.graphQLService.gql.grantUserRole({ userId, roleId });
  }

  async delete(userId: string) {
    await this.graphQLService.gql.deleteUser({ userId });
    // TODO: maybe better to do refresh
    this.users.data.splice(this.users.data.findIndex(user => user.userId === userId), 1);
  }

  async updateCredentials(userId: string, credentials: Record<string, any>) {
    const provider = 'local';
    const processedCredentials = await this.authProviderService.processCredentials(provider, credentials);

    await this.graphQLService.gql.setUserCredentials({
      providerId: provider,
      userId,
      credentials: processedCredentials,
    });
  }

  private async refreshAsync(data: AdminUserInfo[]): Promise<AdminUserInfo[]> {
    const { users } = await this.graphQLService.gql.getUsersList();

    // TODO: temporary before full implementation was provided
    return users as AdminUserInfo[];
  }
}
