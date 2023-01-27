/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { SessionDataResource } from '@cloudbeaver/core-root';
import { GraphQLService, CachedMapResource, CachedMapAllKey, AdminPermissionInfoFragment, AdminObjectGrantInfoFragment, ResourceKey } from '@cloudbeaver/core-sdk';

export type PermissionInfo = AdminPermissionInfoFragment;
export type AdminObjectGrantInfo = AdminObjectGrantInfoFragment;

@injectable()
export class PermissionsResource extends CachedMapResource<string, PermissionInfo> {
  constructor(
    private readonly graphQLService: GraphQLService,
    sessionDataResource: SessionDataResource
  ) {
    super();

    this.sync(sessionDataResource, () => {}, () => CachedMapAllKey);
  }

  protected async loader(): Promise<Map<string, PermissionInfo>> {
    const { permissions } = await this.graphQLService.sdk.getPermissionsList();

    this.data.clear();
    for (const permission of permissions) {
      this.data.set(permission.id, permission as PermissionInfo);
    }

    return this.data;
  }

  protected validateParam(param: ResourceKey<string>): boolean {
    return (
      super.validateParam(param)
      || typeof param === 'string'
    );
  }
}
