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
import { PermissionsService, EPermission } from '@cloudbeaver/core-root';
import { ConnectionConfig, GraphQLService, CachedResource } from '@cloudbeaver/core-sdk';

@injectable()
export class BasicConnectionService {
  readonly dbSources = new CachedResource([], this.loadDBSourcesAsync.bind(this), data => !!data.length)

  constructor(
    private graphQLService: GraphQLService,
    private connectionsManagerService: ConnectionsManagerService,
    private permissionsService: PermissionsService
  ) {
    this.permissionsService.onUpdate.subscribe(() => this.dbSources.refresh());
  }

  public getDBSources(): DBSource[] {
    return this.dbSources.data;
  }

  private async loadDBSourcesAsync(data: DBSource[]): Promise<DBSource[]> {
    if (!await this.permissionsService.hasAsync(EPermission.public)) {
      return [];
    }
    const { dataSourceList } = await this.graphQLService.gql.dataSourceList();
    return dataSourceList;
  }

  async openConnectionAsync(config: ConnectionConfig): Promise<Connection> {
    const response = await this.graphQLService.gql.openConnection({ config });
    this.connectionsManagerService.addOpenedConnection(response.openConnection);
    return response.openConnection;
  }
}
