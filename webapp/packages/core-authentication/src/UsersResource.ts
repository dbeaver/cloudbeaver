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
  ResourceKey,
  AdminConnectionGrantInfo,
  AdminUserInfoFragment,
  ObjectPropertyInfo, AdminUserInfo,
  ResourceKeyUtils
} from '@cloudbeaver/core-sdk';
import { MetadataMap } from '@cloudbeaver/core-utils';

import { AuthInfoService } from './AuthInfoService';
import { AuthProviderService } from './AuthProviderService';

const NEW_USER_SYMBOL = Symbol('new-user');

export type AdminUser = AdminUserInfoFragment;

type AdminUserNew = AdminUser & { [NEW_USER_SYMBOL]: boolean };

interface UserCreateOptions {
  userId: string;
  roles: string[];
  credentials: Record<string, any>;
  grantedConnections: string[];
}

@injectable()
export class UsersResource extends CachedMapResource<string, AdminUser> {
  private loadedKeyMetadata: MetadataMap<string, boolean>;
  constructor(
    private graphQLService: GraphQLService,
    private authProviderService: AuthProviderService,
    private authInfoService: AuthInfoService
  ) {
    super(new Map());
    this.loadedKeyMetadata = new MetadataMap(() => false);
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
      origin: {
        type: 'local',
        displayName: 'Local',
      },
    };
  }

  async loadOrigin(userId: string): Promise<ObjectPropertyInfo[]> {
    const { user } = await this.graphQLService.sdk.getUserOrigin({ userId });

    return user[0].origin.details || [];
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
    const { user } = await this.graphQLService.sdk.createUser({ userId });

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
    const provider = 'local';
    const processedCredentials = await this.authProviderService.processCredentials(provider, credentials);

    await this.graphQLService.sdk.setUserCredentials({
      providerId: provider,
      userId,
      credentials: processedCredentials,
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
    await this.load('all');
    return this.data;
  }

  async refreshAll(): Promise<Map<string, AdminUser>> {
    await this.refresh('all');
    return this.data;
  }

  refreshAllLazy(): void {
    this.markOutdated('all');
    this.loadedKeyMetadata.set('all', false);
  }

  protected async loader(key: ResourceKey<string>): Promise<Map<string, AdminUser>> {
    const userId = key === 'all' ? undefined : key as string;

    const { users } = await this.graphQLService.sdk.getUsersList({ userId });

    if (key === 'all') {
      this.data.clear();
      this.loadedKeyMetadata.set('all', true);
    }

    for (const user of users) {
      this.set(user.userId, user as AdminUser);
    }
    this.markUpdated(key);

    return this.data;
  }

  private isActiveUser(userId: string) {
    return this.authInfoService.userInfo?.userId === userId;
  }
}

export function isLocalUser(user: AdminUser): boolean {
  return user.origin.type === 'local';
}
