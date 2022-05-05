/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { runInAction } from 'mobx';

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
  GetUsersListQueryVariables,
  CachedMapAllKey,
  resourceKeyList
} from '@cloudbeaver/core-sdk';

import { AUTH_PROVIDER_LOCAL_ID } from './AUTH_PROVIDER_LOCAL_ID';
import { AuthInfoService } from './AuthInfoService';
import { AuthProviderService } from './AuthProviderService';
import type { IAuthCredentials } from './IAuthCredentials';

const NEW_USER_SYMBOL = Symbol('new-user');

export type AdminUser = AdminUserInfoFragment;

type AdminUserNew = AdminUser & { [NEW_USER_SYMBOL]: boolean };
type UserResourceIncludes = Omit<GetUsersListQueryVariables, 'userId'>;

interface UserCreateOptions {
  userId: string;
  roles: string[];
  credentials: IAuthCredentials;
  metaParameters: Record<string, any>;
  grantedConnections: string[];
  enabled: boolean;
}

@injectable()
export class UsersResource extends CachedMapResource<string, AdminUser, UserResourceIncludes> {
  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly serverConfigResource: ServerConfigResource,
    private readonly authProviderService: AuthProviderService,
    private readonly authInfoService: AuthInfoService
  ) {
    super();
    this.serverConfigResource.onDataUpdate.addHandler(this.refreshAllLazy.bind(this));
  }

  isNew(id: string): boolean {
    if (!this.has(id)) {
      return true;
    }
    return NEW_USER_SYMBOL in this.get(id)!;
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
      enabled: true,
    };
  }

  async loadConnections(userId: string): Promise<AdminConnectionGrantInfo[]> {
    const { grantedConnections } = await this.graphQLService.sdk.getUserGrantedConnections({ userId });

    return grantedConnections;
  }

  async setConnections(userId: string, connections: string[]): Promise<void> {
    await this.graphQLService.sdk.setConnections({ userId, connections });
  }

  async setMetaParameters(userId: string, parameters: Record<string, any>): Promise<void> {
    await this.graphQLService.sdk.saveUserMetaParameters({ userId, parameters });
  }

  async create({
    userId, roles, credentials, metaParameters, grantedConnections, enabled,
  }: UserCreateOptions): Promise<AdminUser> {
    const { user } = await this.graphQLService.sdk.createUser({
      userId,
      ...this.getDefaultIncludes(),
      ...this.getIncludesMap(userId),
    });

    try {
      await this.updateCredentials(userId, credentials);
      await this.enableUser(userId, enabled, true);
      for (const roleId of roles) {
        await this.grantRole(userId, roleId, true);
      }

      await this.setConnections(userId, grantedConnections);
      await this.setMetaParameters(userId, metaParameters);
      const user = await this.refresh(userId) as AdminUserNew;
      user[NEW_USER_SYMBOL] = true;
    } catch (exception: any) {
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

  async enableUser(userId: string, enabled: boolean, skipUpdate?: boolean): Promise<void> {
    await this.graphQLService.sdk.enableUser({ userId, enabled });

    if (!skipUpdate) {
      await this.refresh(userId);
    }
  }

  async updateCredentials(userId: string, credentials: IAuthCredentials): Promise<void> {
    const processedCredentials = await this.authProviderService.processCredentials(AUTH_PROVIDER_LOCAL_ID, credentials);

    await this.graphQLService.sdk.setUserCredentials({
      providerId: AUTH_PROVIDER_LOCAL_ID,
      userId,
      credentials: processedCredentials.credentials,
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

      runInAction(() => {
        this.data.delete(key);
        this.markUpdated(key);
        this.onItemDelete.execute(key);
      });
    });
  }

  async loadAll(): Promise<Map<string, AdminUser>> {
    this.resetIncludes();
    await this.load(CachedMapAllKey);
    return this.data;
  }

  async refreshAll(): Promise<Map<string, AdminUser>> {
    this.resetIncludes();
    await this.refresh(CachedMapAllKey);
    return this.data;
  }

  refreshAllLazy(): void {
    this.resetIncludes();
    this.markOutdated(CachedMapAllKey);
  }

  isActiveUser(userId: string): boolean {
    return this.authInfoService.userInfo?.userId === userId;
  }

  protected async loader(key: ResourceKey<string>, includes: string[] | undefined): Promise<Map<string, AdminUser>> {
    const all = ResourceKeyUtils.includes(key, CachedMapAllKey);
    key = this.transformParam(key);
    const usersList: AdminUser[] = [];

    await ResourceKeyUtils.forEachAsync(all ? CachedMapAllKey : key, async key => {
      const userId = all ? undefined : key;

      const { users } = await this.graphQLService.sdk.getUsersList({
        userId,
        ...this.getDefaultIncludes(),
        ...this.getIncludesMap(userId, includes),
      });

      usersList.push(...users);
    });

    runInAction(() => {
      if (all) {
        this.data.clear();
      }

      this.set(resourceKeyList(usersList.map(user => user.userId)), usersList);
    });

    return this.data;
  }

  private getDefaultIncludes(): UserResourceIncludes {
    return {
      customIncludeOriginDetails: false,
      includeMetaParameters: false,
    };
  }
}

export function isLocalUser(user: AdminUser): boolean {
  return user.origins.some(origin => origin.type === AUTH_PROVIDER_LOCAL_ID);
}
