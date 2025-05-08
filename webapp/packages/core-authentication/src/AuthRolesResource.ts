/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { CachedDataResource } from '@cloudbeaver/core-resource';
import { EAdminPermission, SessionPermissionsResource } from '@cloudbeaver/core-root';
import { GraphQLService } from '@cloudbeaver/core-sdk';

@injectable()
export class AuthRolesResource extends CachedDataResource<string[]> {
  constructor(
    private readonly graphQLService: GraphQLService,
    sessionPermissionsResource: SessionPermissionsResource,
  ) {
    super(() => []);

    sessionPermissionsResource.require(this, EAdminPermission.admin).outdateResource(this);
  }

  protected async loader(): Promise<string[]> {
    const { roles } = await this.graphQLService.sdk.getAuthRoles();

    return roles;
  }
}
