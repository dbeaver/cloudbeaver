/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { runInAction } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import {
  CachedMapAllKey,
  CachedMapResource,
  CachedResourceOffsetPageKey,
  CachedResourceOffsetPageListKey,
  getOffsetPageKeyInfo,
  isResourceAlias,
  type ResourceKey,
  resourceKeyList,
  resourceKeyListAlias,
  resourceKeyListAliasFactory,
  type ResourceKeySimple,
  ResourceKeyUtils,
} from '@cloudbeaver/core-resource';
import { EAdminPermission, ServerConfigResource, SessionPermissionsResource } from '@cloudbeaver/core-root';
import {
  type AdminConnectionGrantInfo,
  type AdminUserInfo,
  type AdminUserInfoFragment,
  type GetUsersListQueryVariables,
  GraphQLService,
} from '@cloudbeaver/core-sdk';

import { AUTH_PROVIDER_LOCAL_ID } from './AUTH_PROVIDER_LOCAL_ID.js';
import { AuthInfoService } from './AuthInfoService.js';
import { AuthProviderService } from './AuthProviderService.js';
import type { IAuthCredentials } from './IAuthCredentials.js';

const NEW_USER_SYMBOL = Symbol('new-user');

export type AdminUser = AdminUserInfoFragment;
export type AdminUserOrigin = AdminUserInfoFragment['origins'][number];

type AdminUserNew = AdminUser & { [NEW_USER_SYMBOL]: boolean };
export type UserResourceIncludes = Omit<GetUsersListQueryVariables, 'userId' | 'page' | 'filter'>;

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
  authRole?: string;
  enabled?: boolean;
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

    sessionPermissionsResource.require(this, EAdminPermission.admin);
    sessionPermissionsResource.onDataOutdated.addHandler(() => this.markOutdated());
    this.aliases.add(UsersResourceFilterKey, key =>
      resourceKeyList(
        this.entries
          .filter(
            ([userId, user]) =>
              userId.toLowerCase().includes((key.options.userId ?? '').toLowerCase()) &&
              (key.options.enabledState === undefined || user.enabled === key.options.enabledState),
          )
          .map(([userId]) => userId),
      ),
    );

    this.aliases.add(UsersResourceNewUsers, () => {
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

  async addConnectionsAccess(projectId: string, userId: string, connectionIds: string[]): Promise<void> {
    await this.graphQLService.sdk.addConnectionsAccess({
      projectId,
      connectionIds,
      subjects: [userId],
    });
  }

  async deleteConnectionsAccess(projectId: string, userId: string, connectionIds: string[]): Promise<void> {
    await this.graphQLService.sdk.deleteConnectionsAccess({
      projectId,
      connectionIds,
      subjects: [userId],
    });
  }

  async create({ userId, authRole, enabled }: UserCreateOptions): Promise<AdminUser> {
    const { user } = await this.graphQLService.sdk.createUser({
      userId,
      authRole,
      enabled: enabled ?? false,
      ...this.getIncludesMap(userId),
    });

    const newUser = user as unknown as AdminUserNew;
    newUser[NEW_USER_SYMBOL] = true;
    this.set(user.userId, newUser);

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
    const user = this.get(userId);

    if (user) {
      user.enabled = enabled;
    }

    if (!skipUpdate) {
      this.markOutdated(userId);
    }
  }

  async setAuthRole(userId: string, authRole?: string, skipUpdate?: boolean): Promise<void> {
    await this.performUpdate(userId, undefined, async () => {
      await this.graphQLService.sdk.setUserAuthRole({ userId, authRole });

      const user = this.get(userId);

      if (user) {
        user.authRole = authRole;
      }

      this.onDataOutdated.execute(userId);
    });

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

  async deleteUsers(key: ResourceKeySimple<string>): Promise<void> {
    await ResourceKeyUtils.forEachAsync(key, async key => {
      if (this.isActiveUser(key)) {
        throw new Error("You can't delete current logged user");
      }
      await this.graphQLService.sdk.deleteUser({ userId: key });
      this.delete(key);
    });
  }

  isActiveUser(userId: string): boolean {
    return this.authInfoService.userInfo?.userId === userId;
  }

  protected async loader(originalKey: ResourceKey<string>, includes?: string[]): Promise<Map<string, AdminUser>> {
    const all = this.aliases.isAlias(originalKey, CachedMapAllKey);

    if (all) {
      throw new Error('Loading all users is prohibited');
    }

    const usersList: AdminUser[] = [];
    const pages: Parameters<typeof this.offsetPagination.setPage>[] = [];

    await ResourceKeyUtils.forEachAsync(originalKey, async key => {
      let userId: string | undefined;

      if (!isResourceAlias(key)) {
        userId = key;
      }

      if (userId !== undefined) {
        const { user } = await this.graphQLService.sdk.getAdminUserInfo({
          userId,
          ...this.getIncludesMap(userId, includes),
        });

        usersList.push(user);
      } else {
        const { isPageListKey, offset, limit } = getOffsetPageKeyInfo(this, originalKey);
        const filterKey = this.aliases.isAlias(originalKey, UsersResourceFilterKey);
        let userIdMask: string | undefined;
        let enabledState: boolean | undefined;

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
          ...this.getIncludesMap(userId, includes),
        });

        usersList.push(...users);

        pages.push([
          isPageListKey
            ? CachedResourceOffsetPageListKey(offset, users.length).setParent(filterKey)
            : CachedResourceOffsetPageKey(offset, users.length).setParent(filterKey),
          users.map(user => user.userId),
          users.length === limit,
        ]);
      }
    });

    const key = resourceKeyList(usersList.map(user => user.userId));
    runInAction(() => {
      this.set(key, usersList);
      for (const pageArgs of pages) {
        this.offsetPagination.setPage(...pageArgs);
      }
    });

    return this.data;
  }

  protected override dataSet(key: string, value: AdminUserInfoFragment): void {
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
