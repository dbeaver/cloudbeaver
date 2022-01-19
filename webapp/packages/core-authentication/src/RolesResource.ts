/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import {
  GraphQLService,
  CachedMapResource,
  ResourceKey,
  resourceKeyList,
  ResourceKeyList,
  ResourceKeyUtils,
  AdminRoleInfoFragment,
  AdminConnectionGrantInfo,
  CachedMapAllKey
} from '@cloudbeaver/core-sdk';

const NEW_ROLE_SYMBOL = Symbol('new-role');

export type RoleInfo = AdminRoleInfoFragment;
type NewRole = RoleInfo & { [NEW_ROLE_SYMBOL]: boolean; timestamp: number };

@injectable()
export class RolesResource extends CachedMapResource<string, RoleInfo> {
  constructor(private graphQLService: GraphQLService) {
    super();
  }

  async loadAll(): Promise<Map<string, RoleInfo>> {
    await this.load(CachedMapAllKey);
    return this.data;
  }

  async refreshAll(): Promise<Map<string, RoleInfo>> {
    await this.refresh(CachedMapAllKey);
    return this.data;
  }

  async createRole(roleInfo: RoleInfo): Promise<RoleInfo> {
    const response = await this.graphQLService.sdk.createRole(roleInfo);

    const newRole: NewRole = {
      ...response.role,
      [NEW_ROLE_SYMBOL]: true,
      timestamp: Date.now(),
    };

    this.updateRoles(newRole);

    return this.get(roleInfo.roleId)!;
  }

  async updateRole(roleInfo: RoleInfo): Promise<RoleInfo> {
    const { role } = await this.graphQLService.sdk.updateRole(roleInfo);

    this.updateRoles(role);

    return this.get(roleInfo.roleId)!;
  }

  async deleteRole(key: ResourceKey<string>): Promise<Map<string, RoleInfo>> {
    await ResourceKeyUtils.forEachAsync(key, async key => {
      await this.graphQLService.sdk.deleteRole({
        roleId: key,
      });
      this.delete(key);
    });

    return this.data;
  }

  async loadGrantedUsers(roleId: string): Promise<string[]> {
    const { role } = await this.graphQLService.sdk.getRoleGrantedUsers({ roleId });
    return role[0].grantedUsers;
  }

  async getSubjectConnectionAccess(subjectId: string): Promise<AdminConnectionGrantInfo[]> {
    const { grantInfo } = await this.graphQLService.sdk.getSubjectConnectionAccess({ subjectId });
    return grantInfo;
  }

  protected async loader(key: ResourceKey<string>): Promise<Map<string, RoleInfo>> {
    const all = ResourceKeyUtils.includes(key, CachedMapAllKey);

    await ResourceKeyUtils.forEachAsync(all ? CachedMapAllKey : key, async key => {
      const roleId = all ? undefined : key;

      const { roles } = await this.graphQLService.sdk.getRolesList({
        roleId,
      });

      if (all) {
        this.data.clear();
      }

      this.updateRoles(...roles);
    });

    return this.data;
  }

  cleanNewFlags(): void {
    for (const role of this.data.values()) {
      (role as NewRole)[NEW_ROLE_SYMBOL] = false;
    }
  }

  private updateRoles(...roles: RoleInfo[]): ResourceKeyList<string> {
    const key = resourceKeyList(roles.map(role => role.roleId));

    const oldRoles = this.get(key);
    this.set(key, oldRoles.map((role, i) => ({ ...role, ...roles[i] })));

    return key;
  }
}

function isNewRole(role: RoleInfo | NewRole): role is NewRole {
  return (role as NewRole)[NEW_ROLE_SYMBOL];
}

export function compareRoles(a: RoleInfo, b: RoleInfo): number {
  if (isNewRole(a) && isNewRole(b)) {
    return b.timestamp - a.timestamp;
  }

  if (isNewRole(b)) {
    return 1;
  }

  if (isNewRole(a)) {
    return -1;
  }

  return a.roleId.localeCompare(b.roleId);
}
