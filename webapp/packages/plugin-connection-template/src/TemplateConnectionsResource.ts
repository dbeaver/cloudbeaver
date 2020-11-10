/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';

import { Connection } from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import { EPermission, PermissionsResource, PermissionsService } from '@cloudbeaver/core-root';
import { GraphQLService, CachedDataResource } from '@cloudbeaver/core-sdk';

@injectable()
export class TemplateConnectionsResource extends CachedDataResource<Connection[], void> {
  @observable loaded: boolean;
  constructor(
    private graphQLService: GraphQLService,
    private permissionsResource: PermissionsResource,
    private permissionsService: PermissionsService
  ) {
    super([]);
    this.loaded = false;
    this.permissionsResource.onDataUpdate.addHandler(() => this.markOutdated());
  }

  isLoaded(): boolean {
    return this.loaded;
  }

  protected async loader(): Promise<Connection[]> {
    if (!await this.permissionsService.hasAsync(EPermission.public)) {
      this.loaded = true;
      return [];
    }
    const { connections } = await this.graphQLService.sdk.getTemplateConnections();
    this.loaded = true;
    return connections;
  }
}
