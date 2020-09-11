/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Connection } from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import { EPermission, PermissionsService } from '@cloudbeaver/core-root';
import { GraphQLService, CachedDataResource } from '@cloudbeaver/core-sdk';

@injectable()
export class TemplateConnectionsResource extends CachedDataResource<Connection[], null> {
  constructor(
    private graphQLService: GraphQLService,
    private permissionsService: PermissionsService
  ) {
    super([]);
    this.permissionsService.onUpdate.subscribe(() => this.markOutdated(null));
  }

  isLoaded() {
    return !!this.data.length;
  }

  async loadAll() {
    await this.load(null);
    return this.data;
  }

  async refreshAll() {
    await this.refresh(null);
    return this.data;
  }

  protected async loader(key: null): Promise<Connection[]> {
    if (!await this.permissionsService.hasAsync(EPermission.public)) {
      this.markUpdated(key);
      return [];
    }
    const { connections } = await this.graphQLService.sdk.getTemplateConnections();
    this.markUpdated(key);
    return connections;
  }
}
