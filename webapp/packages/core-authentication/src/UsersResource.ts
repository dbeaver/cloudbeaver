/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import {
  GraphQLService,
  CachedMapResource,
  ResourceKey,
  AdminConnectionGrantInfo,
  AdminUserInfoFragment,
  AdminUserInfo,
  ResourceKeyUtils,
  GetUsersListQueryVariables
} from '@cloudbeaver/core-sdk';
import { MetadataMap } from '@cloudbeaver/core-utils';

import { AUTH_PROVIDER_LOCAL_ID } from './AUTH_PROVIDER_LOCAL_ID';
import { AuthInfoService } from './AuthInfoService';
import { AuthProviderService } from './AuthProviderService';

const NEW_USER_SYMBOL = Symbol('new-user');

export type AdminUser = AdminUserInfoFragment;

type AdminUserNew = AdminUser & { [NEW_USER_SYMBOL]: boolean };
type UserResourceIncludes = Omit<GetUsersListQueryVariables, 'userId'>;

interface UserCreateOptions {
  userId: string;
  roles: string[];
  credentials: Record<string, any>;
  grantedConnections: string[];
}

@injectable()
export class UsersResource extends CachedMapResource<string, AdminUser, UserResourceIncludes> {
  static keyAll = 'all';
  private loadedKeyMetadata: MetadataMap<string, boolean>;
  constructor(
    private graphQLService: GraphQLService,
    private serverConfigResource: ServerConfigResource,
    private authProviderService: AuthProviderService,
    private authInfoService: AuthInfoService
  ) {
    super();
    this.loadedKeyMetadata = new MetadataMap(() => false);
    this.serverConfigResource.onDataUpdate.addHandler(this.refreshAllLazy.bind(this));
  }

  isNew(id: string): boolean {
    if (!this.has(id)) {
      return true;
    }
    return NEW_USER_SYMBOL in this.get(id)!;
  }

  has(id: string): boolean {
    if (this.loadedKeyMetadata.has(id)) {
      return this.loadedKeyMetadata.get(id);
    }

    return this.data.has(id);
  }

  getEmptyUser(): AdminUserInfo {
    return {
      userId: '',
      grantedRoles: [],
      grantedConnections: [],
      configurationParameters: {},
      metaParameters: {},
      origins: [{
        type: AUTH_PROVIDER_LOCAL_ID,
        displayName: 'Local',
      }],
      linkedAuthProviders: [AUTH_PROVIDER_LOCAL_ID],
    };
  }

  async loadConnections(userId: string): Promise<AdminConnectionGrantInfo[]> {
    const { grantedConnections } = await this.graphQLService.sdk.getUserGrantedConnections({ userId });

    return grantedConnections;
  }

  async setConnections(userId: string, connections: string[]): Promise<void> {
    await this.graphQLService.sdk.setConnections({ userId, connections });
  }

  async create({
    userId, roles, credentials, grantedConnections,
  }: UserCreateOptions): Promise<AdminUser> {
    const { user } = await this.graphQLService.sdk.createUser({
      userId,
      ...this.getDefaultIncludes(),
      ...this.getIncludesMap(userId),
    });

    try {
      await this.updateCredentials(userId, credentials);
      for (const roleId of roles) {
        await this.grantRole(userId, roleId, true);
      }

      await this.setConnections(userId, grantedConnections);
      const user = await this.refresh(userId) as AdminUserNew;
      user[NEW_USER_SYMBOL] = true;
    } catch (exception) {
      this.delete(userId);
      throw exception;
    }

    return this.get(user.userId)!;
  }

  async grantRole(userId: string, roleId: string, skipUpdate?: boolean): Promise<void> {
    await this.graphQLService.sdk.grantUserRole({ userId, roleId });

    if (!skipUpdate) {
      await this.refresh(userId);
    }
  }

  async revokeRole(userId: string, roleId: string, skipUpdate?: boolean): Promise<void> {
    await this.graphQLService.sdk.revokeUserRole({ userId, roleId });

    if (!skipUpdate) {
      await this.refresh(userId);
    }
  }

  async updateCredentials(userId: string, credentials: Record<string, any>): Promise<void> {
    const processedCredentials = await this.authProviderService.processCredentials(AUTH_PROVIDER_LOCAL_ID, credentials);

    await this.graphQLService.sdk.setUserCredentials({
      providerId: AUTH_PROVIDER_LOCAL_ID,
      userId,
      credentials: processedCredentials,
    });
  }

  async updateLocalPassword(oldPassword: string, newPassword: string): Promise<void> {
    await this.graphQLService.sdk.authChangeLocalPassword({
      oldPassword: this.authProviderService.hashValue(oldPassword),
      newPassword: this.authProviderService.hashValue(newPassword),
    });
  }

  async delete(key: ResourceKey<string>): Promise<void> {
    await ResourceKeyUtils.forEachAsync(key, async key => {
      if (this.isActiveUser(key)) {
        throw new Error('You can\'t delete current logged user');
      }
      await this.graphQLService.sdk.deleteUser({ userId: key });
      this.data.delete(key);
    });
    this.markUpdated(key);
    await this.onItemDelete.execute(key);
  }

  async loadAll(): Promise<Map<string, AdminUser>> {
    this.resetIncludes();
    await this.load(UsersResource.keyAll);
    return this.data;
  }

  async refreshAll(): Promise<Map<string, AdminUser>> {
    this.resetIncludes();
    await this.refresh(UsersResource.keyAll);
    return this.data;
  }

  refreshAllLazy(): void {
    this.resetIncludes();
    this.markOutdated(UsersResource.keyAll);
    this.loadedKeyMetadata.set(UsersResource.keyAll, false);
  }

  protected async loader(key: ResourceKey<string>, includes: string[] | undefined): Promise<Map<string, AdminUser>> {
    await ResourceKeyUtils.forEachAsync(key, async key => {
      const { users } = await this.graphQLService.sdk.getUsersList({
        userId: key === UsersResource.keyAll ? undefined : key,
        ...this.getDefaultIncludes(),
        ...this.getIncludesMap(key === UsersResource.keyAll ? undefined : key, includes),
      });

      if (key === UsersResource.keyAll) {
        this.data.clear();
      }

      for (const user of users) {
        this.set(user.userId, user);
      }

      if (key === UsersResource.keyAll) {
        this.loadedKeyMetadata.set(UsersResource.keyAll, true);
      }
    });

    return this.data;
  }

  private isActiveUser(userId: string) {
    return this.authInfoService.userInfo?.userId === userId;
  }

  private getDefaultIncludes(): UserResourceIncludes {
    return {
      customIncludeOriginDetails: false,
    };
  }
}

export function isLocalUser(user: AdminUser): boolean {
  return user.origins.some(origin => origin.type === AUTH_PROVIDER_LOCAL_ID);
}
