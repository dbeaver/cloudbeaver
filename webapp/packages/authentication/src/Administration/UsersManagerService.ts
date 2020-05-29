/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@dbeaver/core/di';
import { CachedResource, GraphQLService, AdminUserInfo } from '@dbeaver/core/sdk';

import { AuthInfoService } from '../AuthInfoService';
import { AuthProviderService } from '../AuthProviderService';

@injectable()
export class UsersManagerService {
  readonly users = new CachedResource(
    [],
    this.refreshAsync.bind(this),
    (data, _, userId) => (userId ? data.some(user => user.userId === userId) : !!data.length)
  )
  constructor(
    private graphQLService: GraphQLService,
    private authProviderService: AuthProviderService,
    private authInfoService: AuthInfoService,
  ) {
  }

  async create(userId: string, update?: boolean): Promise<AdminUserInfo> {
    const { user } = await this.graphQLService.gql.createUser({ userId });

    if (update) {
    // TODO: maybe better to do refresh
      this.users.data.push(user as AdminUserInfo);
    }
    return user as AdminUserInfo;
  }

  async grantRole(userId: string, roleId: string) {
    await this.graphQLService.gql.grantUserRole({ userId, roleId });
    await this.users.refresh(userId);
  }

  async delete(userId: string, update?: boolean) {
    if (this.authInfoService.userInfo?.userId === userId) {
      throw new Error('You can\'t delete current logged user');
    }
    await this.graphQLService.gql.deleteUser({ userId });

    if (update) {
      await this.users.refresh(userId);
    }
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

  private async refreshAsync(
    data: AdminUserInfo[],
    _: any,
    update: boolean,
    userId?: string
  ): Promise<AdminUserInfo[]> {
    const { users } = await this.graphQLService.gql.getUsersList({ userId });

    if (!userId) {
      return users as AdminUserInfo[];
    }

    const index = data.findIndex(user => user.userId === userId);
    if (index !== -1) {
      data.splice(index, 1, ...users as AdminUserInfo[]);
    } else {
      data.push(...users as AdminUserInfo[]);
    }

    return data;
  }
}
