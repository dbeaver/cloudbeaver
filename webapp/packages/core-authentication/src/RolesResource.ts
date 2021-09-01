/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import {
  GraphQLService,
  AdminRoleInfo,
  CachedMapResource,
  ResourceKey,
  resourceKeyList,
  ResourceKeyList,
  ResourceKeyUtils
} from '@cloudbeaver/core-sdk';
import { MetadataMap } from '@cloudbeaver/core-utils';

const NEW_ROLE_SYMBOL = Symbol('new-role');

export type RoleInfo = Pick<AdminRoleInfo, 'roleId' | 'roleName' | 'description'>;
type NewRole = RoleInfo & { [NEW_ROLE_SYMBOL]: boolean; timestamp: number };

@injectable()
export class RolesResource extends CachedMapResource<string, RoleInfo> {
  static keyAll = resourceKeyList(['all'], 'all');

  private loadedKeyMetadata: MetadataMap<string, boolean>;
  constructor(private graphQLService: GraphQLService) {
    super();
    this.loadedKeyMetadata = new MetadataMap(() => false);
  }

  has(id: string): boolean {
    if (this.loadedKeyMetadata.has(id)) {
      return this.loadedKeyMetadata.get(id);
    }

    return this.data.has(id);
  }

  async loadAll(): Promise<Map<string, RoleInfo>> {
    await this.load(RolesResource.keyAll);
    return this.data;
  }

  async refreshAll(): Promise<Map<string, RoleInfo>> {
    await this.refresh(RolesResource.keyAll);
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

  protected async loader(key: ResourceKey<string>): Promise<Map<string, RoleInfo>> {
    const all = ResourceKeyUtils.hasMark(key, RolesResource.keyAll.mark);

    await ResourceKeyUtils.forEachAsync(all ? RolesResource.keyAll : key, async key => {
      const { roles } = await this.graphQLService.sdk.getRolesList({
        roleId: !all ? key : undefined,
      });

      if (all) {
        this.data.clear();
      }

      this.updateRoles(...roles);

      if (all) {
        this.loadedKeyMetadata.set(RolesResource.keyAll.list[0], true);
      }
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
