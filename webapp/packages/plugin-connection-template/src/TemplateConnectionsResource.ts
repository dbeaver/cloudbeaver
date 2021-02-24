/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { AppAuthService } from '@cloudbeaver/core-authentication';
import { Connection, ConnectionsResource } from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import { EPermission, PermissionsService } from '@cloudbeaver/core-root';
import { GraphQLService, CachedDataResource } from '@cloudbeaver/core-sdk';

@injectable()
export class TemplateConnectionsResource extends CachedDataResource<Connection[], void> {
  constructor(
    private graphQLService: GraphQLService,
    private permissionsService: PermissionsService,
    connectionsResource: ConnectionsResource,
    appAuthService: AppAuthService,
  ) {
    super([]);
    connectionsResource.onDataUpdate.addHandler(() => this.markOutdated());
    appAuthService.auth.addHandler(() => this.markOutdated());
  }

  isLoaded(): boolean {
    return this.loaded;
  }

  protected async loader(): Promise<Connection[]> {
    if (!(await this.permissionsService.hasAsync(EPermission.public))) {
      return [];
    }
    const { connections } = await this.graphQLService.sdk.getTemplateConnections({
      customIncludeNetworkHandlerCredentials: false,
      customIncludeOriginDetails: false,
      includeAuthProperties: true,
      includeOrigin: false,
    });
    return connections;
  }
}
