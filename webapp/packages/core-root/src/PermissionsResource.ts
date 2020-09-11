/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { GraphQLService, CachedDataResource } from '@cloudbeaver/core-sdk';

@injectable()
export class PermissionsResource extends CachedDataResource<Set<string>, null> {
  @observable private loaded = false;

  constructor(
    private graphQLService: GraphQLService,
  ) {
    super(new Set());
  }

  isLoaded() {
    return this.loaded;
  }

  has(id: string): boolean {
    return this.data.has(id);
  }

  protected async loader(key: null): Promise<Set<string>> {
    const { permissions } = await this.graphQLService.sdk.sessionPermissions();

    this.data.clear();
    for (const permission of permissions) {
      this.data.add(permission);
    }
    this.markUpdated(key);
    this.loaded = true;

    return this.data;
  }
}
