/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Connection, DBSource, ConnectionsManagerService } from '@dbeaver/core/app';
import { injectable } from '@dbeaver/core/di';
import { ConnectionConfig, GraphQLService } from '@dbeaver/core/sdk';

@injectable()
export class BasicConnectionService {
  private dbSourcesCache: DBSource[] = [];

  constructor(private graphQLService: GraphQLService,
              private connectionsManagerService: ConnectionsManagerService) {
  }

  public getDBSources(): DBSource[] {
    return this.dbSourcesCache;
  }

  async loadDBSourcesAsync(): Promise<DBSource[]> {
    if (this.dbSourcesCache.length > 0) {
      return this.dbSourcesCache;
    }

    const { dataSourceList } = await this.graphQLService.gql.dataSourceList();
    this.dbSourcesCache = dataSourceList;
    return this.dbSourcesCache;
  }

  async openConnectionAsync(config: ConnectionConfig): Promise<Connection> {
    const response = await this.graphQLService.gql.openConnection({ config });
    this.connectionsManagerService.addOpenedConnection(response.openConnection);
    return response.openConnection;
  }
}
