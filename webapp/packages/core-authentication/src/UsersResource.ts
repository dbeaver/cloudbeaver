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
  isResourceKeyList,
  AdminConnectionGrantInfo
} from '@cloudbeaver/core-sdk';
import { MetadataMap, uuid } from '@cloudbeaver/core-utils';

import { AuthInfoService } from './AuthInfoService';
import { AuthProviderService } from './AuthProviderService';

const NEW_USER_SYMBOL = Symbol('new-user');

type AdminUserNew = AdminUserInfo & { [NEW_USER_SYMBOL]: boolean }

type UserCreateOptions = {
  userId: string;
  newId?: string;
  roles: string[];
  credentials: Record<string, any>;
  grantedConnections: string[];
}

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
      return true;
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
      grantedConnections: [],
      configurationParameters: {},
      metaParameters: {},
      [NEW_USER_SYMBOL]: true,
    } as AdminUserNew;

    this.data.set(user.userId, user);
    this.markUpdated(user.userId);

    return user;
  }

  async loadConnections(userId: string): Promise<AdminConnectionGrantInfo[]> {
    if (this.isNew(userId)) {
      return [];
    }

    const { grantedConnections } = await this.graphQLService.gql.getUserGrantedConnections({ userId });

    return grantedConnections;
  }

  async setConnections(userId: string, connections: string[]) {
    await this.graphQLService.gql.setConnections({ userId, connections });
  }

  async create({
    userId, newId, roles, credentials, grantedConnections,
  }: UserCreateOptions): Promise<AdminUserInfo> {
    const { user } = await this.graphQLService.gql.createUser({ userId });

    if (newId) {
      this.data.delete(newId);
    }
    this.set(userId, user as AdminUserInfo);

    try {
      await this.updateCredentials(userId, credentials);
      for (const roleId of roles) {
        await this.grantRole(userId, roleId, true);
      }

      await this.setConnections(userId, grantedConnections);
    } catch (exception) {
      this.delete(userId);
      throw exception;
    }

    return this.get(user.userId)!;
  }

  async grantRole(userId: string, roleId: string, skipUpdate?: boolean) {
    await this.graphQLService.gql.grantUserRole({ userId, roleId });

    if (!skipUpdate) {
      await this.refresh(userId);
    }
  }

  async revokeRole(userId: string, roleId: string, skipUpdate?: boolean) {
    await this.graphQLService.gql.revokeUserRole({ userId, roleId });

    if (!skipUpdate) {
      await this.refresh(userId);
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

  async delete(key: ResourceKey<string>) {
    if (isResourceKeyList(key)) {
      for (let i = 0; i < key.list.length; i++) {
        if (this.isActiveUser(key.list[i])) {
          throw new Error('You can\'t delete current logged user');
        }
        if (!this.isNew(key.list[i])) {
          await this.graphQLService.gql.deleteUser({ userId: key.list[i] });
        }
        this.data.delete(key.list[i]);
      }
    } else {
      if (this.isActiveUser(key)) {
        throw new Error('You can\'t delete current logged user');
      }
      if (!this.isNew(key)) {
        await this.graphQLService.gql.deleteUser({ userId: key });
      }
      this.data.delete(key);
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

  private isConnectionsLoaded(key: ResourceKey<string>) {
    if (isResourceKeyList(key)) {
      return this.get(key).every(user => !!user?.grantedConnections);
    }
    return !!this.get(key)?.grantedConnections;
  }

  private isActiveUser(userId: string) {
    return this.authInfoService.userInfo?.userId === userId;
  }
}
