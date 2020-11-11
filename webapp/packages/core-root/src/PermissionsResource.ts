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

import { SessionResource } from './SessionResource';

@injectable()
export class PermissionsResource extends CachedDataResource<Set<string>, void> {
  @observable private loaded: boolean;

  constructor(
    private graphQLService: GraphQLService,
    private sessionResource: SessionResource
  ) {
    super(new Set());
    this.loaded = false;
    this.sessionResource.onDataOutdated.addHandler(this.markOutdated.bind(this));
    this.sessionResource.onDataUpdate.addHandler(() => { this.load(); });
  }

  isLoaded(): boolean {
    return this.loaded;
  }

  has(id: string): boolean {
    return this.data.has(id);
  }

  protected async loader(): Promise<Set<string>> {
    await this.sessionResource.load();

    const { permissions } = await this.graphQLService.sdk.sessionPermissions();

    this.data.clear();
    for (const permission of permissions) {
      this.data.add(permission);
    }
    this.loaded = true;

    return this.data;
  }
}
