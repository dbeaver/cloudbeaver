/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { PermissionInfo } from '@cloudbeaver/core-administration';
import { injectable } from '@cloudbeaver/core-di';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import { GraphQLService, CachedDataResource } from '@cloudbeaver/core-sdk';

@injectable()
export class ProjectPermissionsResource extends CachedDataResource<PermissionInfo[]> {
  constructor(
    private readonly graphQLService: GraphQLService,
    serverConfigResource: ServerConfigResource
  ) {
    super(() => []);

    this.sync(serverConfigResource, () => {}, () => {});
  }

  protected async loader(): Promise<PermissionInfo[]> {
    const { permissions } = await this.graphQLService.sdk.getProjectPermissionsList();

    return permissions;
  }
}
