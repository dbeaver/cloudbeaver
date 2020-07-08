/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import {
  Connection, DBSource, ConnectionsManagerService
} from '@cloudbeaver/core-app';
import { injectable } from '@cloudbeaver/core-di';
import { PermissionsService } from '@cloudbeaver/core-root';
import { ConnectionConfig, GraphQLService } from '@cloudbeaver/core-sdk';

import { DataSourcesResource } from './DataSourcesResource';

@injectable()
export class BasicConnectionService {

  constructor(
    private graphQLService: GraphQLService,
    private connectionsManagerService: ConnectionsManagerService,
    private permissionsService: PermissionsService,
    readonly dbSources: DataSourcesResource
  ) {
    this.permissionsService.onUpdate.subscribe(() => this.dbSources.refresh(null));
  }

  public getDBSources(): DBSource[] {
    return this.dbSources.data;
  }

  async openConnectionAsync(config: ConnectionConfig): Promise<Connection> {
    const response = await this.graphQLService.gql.openConnection({ config });
    this.connectionsManagerService.addOpenedConnection(response.openConnection);
    return response.openConnection;
  }
}
