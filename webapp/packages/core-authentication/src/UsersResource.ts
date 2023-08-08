/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { ServerConfigResource, SessionPermissionsResource } from '@cloudbeaver/core-root';
import {
  AdminConnectionGrantInfo,
  AdminUserInfo,
  AdminUserInfoFragment,
  CACHED_RESOURCE_DEFAULT_PAGE_LIMIT,
  CACHED_RESOURCE_DEFAULT_PAGE_OFFSET,
  CachedMapAllKey,
  CachedMapResource,
  CachedResourcePageKey,
  GetUsersListQueryVariables,
  GraphQLService,
  isResourceAlias,
  ResourceKey,
  resourceKeyList,
  resourceKeyListAlias,
  resourceKeyListAliasFactory,
  ResourceKeySimple,
  ResourceKeyUtils,
} from '@cloudbeaver/core-sdk';

import { AUTH_PROVIDER_LOCAL_ID } from './AUTH_PROVIDER_LOCAL_ID';
import { AuthInfoService } from './AuthInfoService';
import { AuthProviderService } from './AuthProviderService';
import { EAdminPermission } from './EAdminPermission';
import type { IAuthCredentials } from './IAuthCredentials';

const NEW_USER_SYMBOL = Symbol('new-user');

export type AdminUser = AdminUserInfoFragment;

type AdminUserNew = AdminUser & { [NEW_USER_SYMBOL]: boolean };
type UserResourceIncludes = Omit<GetUsersListQueryVariables, 'userId' | 'page' | 'filter'>;

interface IUserResourceFilterOptions {
  userId?: string;
  enabledState?: boolean;
}

export const UsersResourceFilterKey = resourceKeyListAliasFactory<
  any,
  [userId?: string, enabledState?: boolean],
  Readonly<IUserResourceFilterOptions>
>('@users-resource/filter', (userId?: string, enabledState?: boolean) => ({ userId, enabledState }));

export const UsersResourceNewUsers = resourceKeyListAlias('@users-resource/new-users');

interface UserCreateOptions {
  userId: string;
  teams: string[];
  credentials: IAuthCredentials;
  metaParameters: Record<string, any>;
  grantedConnections: string[];
  enabled: boolean;
  authRole?: string;
}

@injectable()
export class UsersResource extends CachedMapResource<string, AdminUser, UserResourceIncludes> {
  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly serverConfigResource: ServerConfigResource,
    private readonly authProviderService: AuthProviderService,
    private readonly authInfoService: AuthInfoService,
    sessionPermissionsResource: SessionPermissionsResource,
  ) {
    super();

    sessionPermissionsResource.require(this, EAdminPermission.admin).outdateResource(this);
    this.addAlias(UsersResourceFilterKey, key =>
      resourceKeyList(
        this.entries
          .filter(
            ([userId, user]) =>
              userId.includes(key.options.userId ?? '') && (key.options.enabledState === undefined || user.enabled === key.options.enabledState),
          )
          .map(([userId]) => userId),
      ),
    );

    this.addAlias(UsersResourceNewUsers, () => {
      const orderedKeys = this.entries
        .filter(k => isNewUser(k[1]))
        .sort((a, b) => compareUsers(a[1], b[1]))
        .map(([key]) => key);
      return resourceKeyList(orderedKeys);
    });
  }

  getEmptyUser(): AdminUserInfo {
    return {
      userId: '',
      grantedTeams: [],
      grantedConnections: [],
      configurationParameters: {},
      metaParameters: {},
      origins: [
        {
          type: AUTH_PROVIDER_LOCAL_ID,
          displayName: 'Local',
        },
      ],
      linkedAuthProviders: [AUTH_PROVIDER_LOCAL_ID],
      enabled: true,
      authRole: this.serverConfigResource.data?.defaultAuthRole ?? undefined,
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

  async create({ userId, teams, credentials, metaParameters, grantedConnections, enabled, authRole }: UserCreateOptions): Promise<AdminUser> {
    const { user } = await this.graphQLService.sdk.createUser({
      userId,
      enabled,
      authRole,
      ...this.getDefaultIncludes(),
      ...this.getIncludesMap(userId),
    });

    try {
      await this.updateCredentials(userId, credentials);

      for (const teamId of teams) {
        await this.grantTeam(userId, teamId, true);
      }

      await this.setConnections(userId, grantedConnections);
      await this.setMetaParameters(userId, metaParameters);
      const user = (await this.refresh(userId)) as unknown as AdminUserNew;
      user[NEW_USER_SYMBOL] = true;
    } catch (exception: any) {
      this.delete(userId);
      throw exception;
    }

    return this.get(user.userId)!;
  }

  cleanNewFlags(): void {
    for (const user of this.data.values()) {
      (user as AdminUserNew)[NEW_USER_SYMBOL] = false;
    }
  }

  async grantTeam(userId: string, teamId: string, skipUpdate?: boolean): Promise<void> {
    await this.graphQLService.sdk.grantUserTeam({ userId, teamId });

    if (!skipUpdate) {
      await this.refresh(userId);
    }
  }

  async revokeTeam(userId: string, teamId: string, skipUpdate?: boolean): Promise<void> {
    await this.graphQLService.sdk.revokeUserTeam({ userId, teamId });

    if (!skipUpdate) {
      await this.refresh(userId);
    }
  }

  async enableUser(userId: string, enabled: boolean, skipUpdate?: boolean): Promise<void> {
    await this.graphQLService.sdk.enableUser({ userId, enabled });

    if (!skipUpdate) {
      this.markOutdated(userId);
    }
  }

  async setAuthRole(userId: string, authRole?: string, skipUpdate?: boolean): Promise<void> {
    await this.graphQLService.sdk.setUserAuthRole({ userId, authRole });

    if (!skipUpdate) {
      this.markOutdated(userId);
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

  async deleteCredentials(userId: string, providerId: string): Promise<void> {
    await this.graphQLService.sdk.deleteUserCredentials({ userId, providerId });
    await this.refresh(userId);
  }

  async updateLocalPassword(oldPassword: string, newPassword: string): Promise<void> {
    await this.graphQLService.sdk.authChangeLocalPassword({
      oldPassword: this.authProviderService.hashValue(oldPassword),
      newPassword: this.authProviderService.hashValue(newPassword),
    });
  }

  async delete(key: ResourceKeySimple<string>): Promise<void> {
    await ResourceKeyUtils.forEachAsync(key, async key => {
      if (this.isActiveUser(key)) {
        throw new Error("You can't delete current logged user");
      }
      await this.graphQLService.sdk.deleteUser({ userId: key });
      super.delete(key);
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

  isActiveUser(userId: string): boolean {
    return this.authInfoService.userInfo?.userId === userId;
  }

  protected async loader(originalKey: ResourceKey<string>, includes?: string[]): Promise<Map<string, AdminUser>> {
    const all = this.isAlias(originalKey, CachedMapAllKey);

    if (all) {
      throw new Error('Loading all users is prohibited');
    }

    const usersList: AdminUser[] = [];

    await ResourceKeyUtils.forEachAsync(originalKey, async key => {
      let userId: string | undefined;

      if (!isResourceAlias(key)) {
        userId = key;
      }

      if (userId !== undefined) {
        const { user } = await this.graphQLService.sdk.getAdminUserInfo({
          userId,
          ...this.getDefaultIncludes(),
          ...this.getIncludesMap(userId, includes),
        });

        usersList.push(user);
      } else {
        const pageKey = this.isAlias(originalKey, CachedResourcePageKey);
        const filterKey = this.isAlias(originalKey, UsersResourceFilterKey);
        let offset = CACHED_RESOURCE_DEFAULT_PAGE_OFFSET;
        let limit = CACHED_RESOURCE_DEFAULT_PAGE_LIMIT;
        let userIdMask: string | undefined;
        let enabledState: boolean | undefined;

        if (pageKey) {
          offset = pageKey.options.offset;
          limit = pageKey.options.limit;
        }

        if (filterKey) {
          userIdMask = filterKey.options.userId;
          enabledState = filterKey.options.enabledState;
        }

        const { users } = await this.graphQLService.sdk.getUsersList({
          page: {
            offset,
            limit,
          },
          filter: {
            userIdMask,
            enabledState,
          },
          ...this.getDefaultIncludes(),
          ...this.getIncludesMap(userId, includes),
        });

        usersList.push(...users);

        this.setPageEnd(CachedResourcePageKey(offset, users.length).setTarget(filterKey), users.length === limit);
      }
    });

    const key = resourceKeyList(usersList.map(user => user.userId));
    this.set(key, usersList);

    return this.data;
  }

  private getDefaultIncludes(): UserResourceIncludes {
    return {
      customIncludeOriginDetails: false,
      includeMetaParameters: false,
    };
  }

  protected dataSet(key: string, value: AdminUserInfoFragment): void {
    const oldValue = this.data.get(key);
    super.dataSet(key, { ...oldValue, ...value });
  }

  protected validateKey(key: string): boolean {
    return typeof key === 'string';
  }
}

export function isLocalUser(user: AdminUser): boolean {
  return user.origins.some(origin => origin.type === AUTH_PROVIDER_LOCAL_ID);
}

export function isNewUser(user: AdminUser): boolean {
  return NEW_USER_SYMBOL in user && user[NEW_USER_SYMBOL] === true;
}

export function compareUsers(a: AdminUser, b: AdminUser): number {
  return a.userId.localeCompare(b.userId);
}
