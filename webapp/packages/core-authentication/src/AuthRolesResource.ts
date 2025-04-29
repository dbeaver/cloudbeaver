/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { CachedMapResource, resourceKeyList } from '@cloudbeaver/core-resource';
import { EAdminPermission, SessionPermissionsResource } from '@cloudbeaver/core-root';
import { GraphQLService, type GetAuthRolesQuery } from '@cloudbeaver/core-sdk';
import { ELMRole } from './ELMRole.js';

export type AuthRoleInfo = GetAuthRolesQuery['roles'][number];

interface AuthRoleUpdateOptions {
  settings: Record<string, string | number | null>;
}

@injectable()
export class AuthRolesResource extends CachedMapResource<ELMRole, AuthRoleInfo> {
  constructor(
    private readonly graphQLService: GraphQLService,
    sessionPermissionsResource: SessionPermissionsResource,
  ) {
    super(() => new Map());

    sessionPermissionsResource.require(this, EAdminPermission.admin).outdateResource(this);
  }

  async update(id: ELMRole, options: AuthRoleUpdateOptions): Promise<void> {
    await this.performUpdate(id, undefined, () =>
      this.graphQLService.sdk.updateAuthRole({
        authRoleId: id,
        settings: options.settings,
      }),
    );
  }

  protected async loader(): Promise<Map<ELMRole, AuthRoleInfo>> {
    try {
      const { roles } = await this.graphQLService.sdk.getAuthRoles();

      this.replace(resourceKeyList(roles.map(role => role.id as ELMRole)), roles);
    } catch (e: any) {
      console.error(e);
      this.replace(resourceKeyList([ELMRole.ADMINISTRATOR, ELMRole.DATA_MANAGER, ELMRole.EDITOR, ELMRole.VIEWER, ELMRole.DEVELOPER]), [
        {
          id: ELMRole.ADMINISTRATOR,
          settings: {},
        },
        {
          id: ELMRole.DATA_MANAGER,
          settings: {},
        },
        {
          id: ELMRole.EDITOR,
          settings: {},
        },
        {
          id: ELMRole.VIEWER,
          settings: {},
        },
        {
          id: ELMRole.DEVELOPER,
          settings: {},
        },
      ]);
    }
    return this.data;
  }

  protected override validateKey(key: ELMRole): boolean {
    return typeof key === 'string';
  }
}
