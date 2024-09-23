/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { CachedMapAllKey, CachedMapResource, resourceKeyList } from '@cloudbeaver/core-resource';
import { SessionDataResource } from '@cloudbeaver/core-root';
import { type AdminObjectGrantInfoFragment, type AdminPermissionInfoFragment, GraphQLService } from '@cloudbeaver/core-sdk';

export type PermissionInfo = AdminPermissionInfoFragment;
export type AdminObjectGrantInfo = AdminObjectGrantInfoFragment;

@injectable()
export class PermissionsResource extends CachedMapResource<string, PermissionInfo> {
  constructor(
    private readonly graphQLService: GraphQLService,
    sessionDataResource: SessionDataResource,
  ) {
    super();

    this.sync(
      sessionDataResource,
      () => {},
      () => CachedMapAllKey,
    );
  }

  protected async loader(): Promise<Map<string, PermissionInfo>> {
    const { permissions } = await this.graphQLService.sdk.getPermissionsList();

    this.replace(resourceKeyList(permissions.map(permission => permission.id)), permissions);

    return this.data;
  }

  protected validateKey(key: string): boolean {
    return typeof key === 'string';
  }
}
