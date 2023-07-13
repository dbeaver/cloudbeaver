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
  CachedMapAllKey,
  CachedMapPageKey,
  CachedMapResource,
  GetUsersListQueryVariables,
  GraphQLService,
  ICachedMapPageOptions,
  isResourceAlias,
  ResourceKey,
  ResourceKeyFlat,
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
type UserResourceIncludes = Omit<GetUsersListQueryVariables, 'userId' | 'after' | 'first'>;

interface IUserResourceSearchPageOptions extends ICachedMapPageOptions {
  userId?: string;
}

export const UsersResourceSearchUser = resourceKeyListAliasFactory<
  any,
  [first: number, after?: any, userId?: string],
  Readonly<IUserResourceSearchPageOptions>
>('@users-resource/page', (first: number, after?: any, userId?: any) => ({ first, after, userId }));

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
    this.addAlias(UsersResourceSearchUser, key => {
      const pageInfo = this.getPageInfo(key as ResourceKeyFlat<string>);

      return resourceKeyList(pageInfo?.edges || []);
    });

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
    const search = this.isAlias(originalKey, UsersResourceSearchUser);
    const page = this.isAlias(originalKey, CachedMapPageKey);
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
        const { users } = await this.graphQLService.sdk.getUsersList({
          first: page || search ? originalKey.options.first : 100,
          after: page || search ? originalKey.options.after : undefined,
          userIdMask: search ? originalKey.options.userId : undefined,
          ...this.getDefaultIncludes(),
          ...this.getIncludesMap(userId, includes),
        });

        usersList.push(...(users?.edges.map(edge => edge.node) ?? []));

        if (page || search) {
          this.setPageInfo(originalKey, {
            totalCount: users?.totalCount ?? 0,
            edges: users?.edges.map(edge => edge.cursor) ?? [],
            pageInfo: {
              endCursor: users?.pageInfo.endCursor ?? null,
              hasNextPage: users?.pageInfo.hasNextPage ?? false,
            },
          });
        }
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

  protected validateKey(key: string): boolean {
    return typeof key === 'string';
  }
}

export function isLocalUser(user: AdminUser): boolean {
  return user.origins.some(origin => origin.type === AUTH_PROVIDER_LOCAL_ID);
}

export function isNewUser(user: AdminUser): boolean {
  return NEW_USER_SYMBOL in user;
}

export function compareUsers(a: AdminUser, b: AdminUser): number {
  return a.userId.localeCompare(b.userId);
}
