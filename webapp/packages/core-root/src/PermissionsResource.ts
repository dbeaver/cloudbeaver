/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { ExecutorInterrupter } from '@cloudbeaver/core-executor';
import { GraphQLService, CachedDataResource, CachedResource } from '@cloudbeaver/core-sdk';

import { SessionDataResource } from './SessionDataResource';

@injectable()
export class PermissionsResource extends CachedDataResource<Set<string>> {
  constructor(
    private readonly graphQLService: GraphQLService,
    sessionDataResource: SessionDataResource
  ) {
    super(new Set());

    this.sync(sessionDataResource, () => {}, () => {});
  }

  require(resource: CachedResource<any, any, any, any>, ...permissions: string[]): this {
    resource
      .preloadResource(this, () => undefined)
      .before(ExecutorInterrupter.interrupter(() => !this.has(...permissions)));

    return this;
  }

  has(...permissions: string[]): boolean {
    return !permissions.some(permission => !this.data.has(permission));
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
