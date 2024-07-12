/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { PermissionInfo } from '@cloudbeaver/core-administration';
import { injectable } from '@cloudbeaver/core-di';
import { CachedDataResource } from '@cloudbeaver/core-resource';
import { EAdminPermission, SessionPermissionsResource } from '@cloudbeaver/core-root';
import { GraphQLService } from '@cloudbeaver/core-sdk';

@injectable()
export class ProjectPermissionsResource extends CachedDataResource<PermissionInfo[]> {
  constructor(
    private readonly graphQLService: GraphQLService,
    permissionsResource: SessionPermissionsResource,
  ) {
    super(() => []);

    permissionsResource.require(this, EAdminPermission.admin).outdateResource(this);
  }

  protected async loader(): Promise<PermissionInfo[]> {
    const { permissions } = await this.graphQLService.sdk.getProjectPermissionsList();

    return permissions;
  }
}
