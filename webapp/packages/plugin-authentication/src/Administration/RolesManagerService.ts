/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import {
  CachedResource, GraphQLService, AdminRoleInfo
} from '@cloudbeaver/core-sdk';

@injectable()
export class RolesManagerService {
  readonly roles = new CachedResource(
    [],
    this.refreshAsync.bind(this),
    data => !!data.length
  )
  constructor(
    private graphQLService: GraphQLService,
  ) {
  }

  private async refreshAsync(
    data: AdminRoleInfo[],
    _: any,
    update: boolean,
    roleId?: string
  ): Promise<AdminRoleInfo[]> {
    const { roles } = await this.graphQLService.gql.getRolesList({ roleId });

    if (!roleId) {
      return roles as AdminRoleInfo[];
    }

    const index = data.findIndex(role => role.roleId === roleId);
    if (index !== -1) {
      data.splice(index, 1, ...roles as AdminRoleInfo[]);
    } else {
      data.push(...roles as AdminRoleInfo[]);
    }

    return data;
  }
}
