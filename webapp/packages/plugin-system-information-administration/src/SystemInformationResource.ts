/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { CachedDataResource } from '@cloudbeaver/core-resource';
import { GraphQLService, type ObjectPropertyInfo } from '@cloudbeaver/core-sdk';
import { SessionPermissionsResource, EAdminPermission } from '@cloudbeaver/core-root';

@injectable()
export class SystemInformationResource extends CachedDataResource<ObjectPropertyInfo[]> {
  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly sessionPermissionsResource: SessionPermissionsResource,
  ) {
    super(() => []);
    this.sessionPermissionsResource.require(this, EAdminPermission.admin).outdateResource(this);
  }

  protected async loader(): Promise<ObjectPropertyInfo[]> {
    const { info } = await this.graphQLService.sdk.getSystemInfo();
    return info;
  }
}
