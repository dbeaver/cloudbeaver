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
  CachedMapResource,
  AdminUserInfo,
  ResourceKey,
  isResourceKeyList
} from '@cloudbeaver/core-sdk';
import { MetadataMap, uuid } from '@cloudbeaver/core-utils';

import { AuthInfoService } from '../AuthInfoService';
import { AuthProviderService } from '../AuthProviderService';

const NEW_USER_SYMBOL = Symbol('new-user');

@injectable()
export class UsersResource extends CachedMapResource<string, AdminUserInfo> {
  private metadata: MetadataMap<string, boolean>;
  constructor(
    private graphQLService: GraphQLService,
    private authProviderService: AuthProviderService,
    private authInfoService: AuthInfoService,
  ) {
    super(new Map());
    this.metadata = new MetadataMap(() => false);
  }

  isNew(id: string): boolean {
    if (!this.has(id)) {
      return false;
    }
    return NEW_USER_SYMBOL in this.get(id)!;
  }

  has(id: string) {
    if (this.metadata.has(id)) {
      return this.metadata.get(id);
    }

    return this.data.has(id);
  }

  addNew() {
    const user = {
      userId: `new-${uuid()}`,
      grantedRoles: [],
      configurationParameters: {},
      metaParameters: {},
      [NEW_USER_SYMBOL]: true,
    } as AdminUserInfo;

    this.data.set(user.userId, user);
    this.markUpdated(user.userId);

    return user;
  }

  async create(userId: string, id?: string): Promise<AdminUserInfo> {
    const { user } = await this.graphQLService.gql.createUser({ userId });

    if (id) {
      this.data.delete(id);
    }
    this.set(user.userId, user as AdminUserInfo);

    return this.get(user.userId)!;
  }

  async grantRole(userId: string, roleId: string) {
    await this.graphQLService.gql.grantUserRole({ userId, roleId });
    await this.refresh(userId);
  }

  async revokeRole(userId: string, roleId: string) {
    await this.graphQLService.gql.revokeUserRole({ userId, roleId });
    await this.refresh(userId);
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

  async delete(key: ResourceKey<string>) {
    if (isResourceKeyList(key)) {
      for (let i = 0; i < key.list.length; i++) {
        if (this.isActiveUser(key.list[i])) {
          throw new Error('You can\'t delete current logged user');
        }
        this.data.delete(key.list[i]);
        if (!this.isNew(key.list[i])) {
          await this.graphQLService.gql.deleteUser({ userId: key.list[i] });
        }
      }
    } else {
      if (this.isActiveUser(key)) {
        throw new Error('You can\'t delete current logged user');
      }
      this.data.delete(key);
      if (!this.isNew(key)) {
        await this.graphQLService.gql.deleteUser({ userId: key });
      }
    }
    this.markUpdated(key);
    this.itemDeleteSubject.next(key);
  }

  async loadAll() {
    await this.load('all');
    return this.data;
  }

  async refreshAll() {
    await this.refresh('all');
    return this.data;
  }

  protected async loader(key: ResourceKey<string>): Promise<Map<string, AdminUserInfo>> {
    const userId = key === 'all' ? undefined : key as string;

    const { users } = await this.graphQLService.gql.getUsersList({ userId });

    if (key === 'all') {
      this.data.clear();
      this.metadata.set('all', true);
    }

    for (const user of users) {
      this.set(user.userId, user as AdminUserInfo);
    }
    this.markUpdated(key);

    return this.data;
  }

  private isActiveUser(userId: string) {
    return this.authInfoService.userInfo?.userId === userId;
  }
}
