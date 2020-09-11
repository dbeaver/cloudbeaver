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
  AdminRoleInfo,
  CachedMapResource,
  ResourceKey
} from '@cloudbeaver/core-sdk';
import { MetadataMap } from '@cloudbeaver/core-utils';

@injectable()
export class RolesResource extends CachedMapResource<string, AdminRoleInfo> {
  private metadata: MetadataMap<string, boolean>;
  constructor(private graphQLService: GraphQLService) {
    super(new Map());
    this.metadata = new MetadataMap(() => false);
  }

  has(id: string) {
    if (this.metadata.has(id)) {
      return this.metadata.get(id);
    }

    return this.data.has(id);
  }

  async loadAll() {
    await this.load('all');
    return this.data;
  }

  async refreshAll() {
    await this.refresh('all');
    return this.data;
  }

  protected async loader(key: ResourceKey<string>): Promise<Map<string, AdminRoleInfo>> {
    const roleId = key === 'all' ? undefined : key as string;

    const { roles } = await this.graphQLService.sdk.getRolesList({ roleId });

    if (key === 'all') {
      this.data.clear();
      this.metadata.set('all', true);
    }

    for (const role of roles) {
      this.set(role.roleId, role as AdminRoleInfo);
    }
    this.markUpdated(key);

    return this.data;
  }
}
