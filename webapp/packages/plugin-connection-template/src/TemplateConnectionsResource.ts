/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { AppAuthService } from '@cloudbeaver/core-authentication';
import { Connection, ConnectionInfoResource } from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import {  SessionDataResource } from '@cloudbeaver/core-root';
import { GraphQLService, CachedDataResource, ResourceKeyUtils } from '@cloudbeaver/core-sdk';

@injectable()
export class TemplateConnectionsResource extends CachedDataResource<Connection[]> {
  constructor(
    private readonly graphQLService: GraphQLService,
    connectionInfoResource: ConnectionInfoResource,
    sessionDataResource:SessionDataResource,
    appAuthService: AppAuthService,
  ) {
    super([]);

    this.sync(sessionDataResource);

    appAuthService.requireAuthentication(this);

    connectionInfoResource.onConnectionCreate.addHandler(connection => {
      if (connection.template) {
        this.markOutdated();
      }
    });
    connectionInfoResource.onItemDelete.addHandler(list => {
      const isAnyTemplate = connectionInfoResource
        .get(ResourceKeyUtils.toList(list))
        .some(connection => connection?.template);

      if (isAnyTemplate) {
        this.markOutdated();
      }
    });
  }

  isLoaded(): boolean {
    return this.loaded;
  }

  protected async loader(): Promise<Connection[]> {
    const { connections } = await this.graphQLService.sdk.getTemplateConnections({
      includeNetworkHandlersConfig: true,
      customIncludeOriginDetails: false,
      includeAuthProperties: true,
      includeOrigin: false,
      includeAuthNeeded: false,
      includeCredentialsSaved: false,
      includeProperties: false,
      includeProviderProperties: false,
      customIncludeOptions: false,
    });
    return connections;
  }
}
