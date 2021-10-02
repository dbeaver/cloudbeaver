/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Connection, ConnectionsResource } from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import { EPermission, PermissionsResource } from '@cloudbeaver/core-root';
import { GraphQLService, CachedDataResource } from '@cloudbeaver/core-sdk';

@injectable()
export class TemplateConnectionsResource extends CachedDataResource<Connection[], void> {
  constructor(
    private graphQLService: GraphQLService,
    permissionsResource: PermissionsResource,
    connectionsResource: ConnectionsResource,
  ) {
    super([]);

    connectionsResource.outdateResource(this, () => undefined);

    permissionsResource
      .require(this, EPermission.public)
      .outdateResource(this);
  }

  isLoaded(): boolean {
    return this.loaded;
  }

  protected async loader(): Promise<Connection[]> {
    const { connections } = await this.graphQLService.sdk.getTemplateConnections({
      customIncludeNetworkHandlerCredentials: false,
      customIncludeOriginDetails: false,
      includeAuthProperties: true,
      includeOrigin: false,
    });
    return connections;
  }
}
