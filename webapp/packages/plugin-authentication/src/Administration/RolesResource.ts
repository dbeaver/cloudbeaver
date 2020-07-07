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
  CachedDataResource,
  AdminRoleInfo
} from '@cloudbeaver/core-sdk';

@injectable()
export class RolesResource extends CachedDataResource<AdminRoleInfo[], string | undefined> {
  constructor(
    private graphQLService: GraphQLService,
  ) {
    super([]);
  }

  isLoaded(roleId?: string) {
    return roleId
      ? this.data.some(role => role.roleId === roleId)
      : !!this.data.length;
  }

  protected async loader(roleId?: string): Promise<AdminRoleInfo[]> {
    const { roles } = await this.graphQLService.gql.getRolesList({ roleId });

    if (!roleId) {
      return roles as AdminRoleInfo[];
    }

    const index = this.data.findIndex(role => role.roleId === roleId);
    if (index !== -1) {
      this.data.splice(index, 1, ...roles as AdminRoleInfo[]);
    } else {
      this.data.push(...roles as AdminRoleInfo[]);
    }

    return this.data;
  }
}
