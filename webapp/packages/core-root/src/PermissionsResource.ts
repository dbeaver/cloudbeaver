/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { GraphQLService, CachedDataResource } from '@cloudbeaver/core-sdk';

import { SessionDataResource } from './SessionDataResource';

@injectable()
export class PermissionsResource extends CachedDataResource<Set<string>, void> {
  constructor(
    private graphQLService: GraphQLService,
    sessionDataResource: SessionDataResource
  ) {
    super(new Set());

    this.sync(sessionDataResource);
  }

  has(id: string): boolean {
    return this.data.has(id);
  }

  async hasAsync(id: string): Promise<boolean> {
    await this.load();
    return this.has(id);
  }

  protected async loader(): Promise<Set<string>> {
    const { permissions } = await this.graphQLService.sdk.sessionPermissions();

    this.data.clear();
    for (const permission of permissions) {
      this.data.add(permission);
    }

    return this.data;
  }
}
