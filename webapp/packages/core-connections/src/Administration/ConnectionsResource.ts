/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import {
  GraphQLService,
  CachedDataResource,
  ConnectionInfo,
  ConnectionConfig,
} from '@cloudbeaver/core-sdk';

@injectable()
export class ConnectionsResource extends CachedDataResource<ConnectionInfo[], string | undefined> {
  constructor(
    private graphQLService: GraphQLService,
  ) {
    super([]);
  }

  isLoaded(id?: string) {
    return id
      ? this.data.some(connection => connection.id === id)
      : !!this.data.length;
  }

  async create(config: ConnectionConfig) {
    const { connection } = await this.graphQLService.gql.createConnectionConfiguration({ config });

    this.data.push(connection as ConnectionInfo);

    return connection as ConnectionInfo;
  }

  async delete(id: string) {
    await this.graphQLService.gql.deleteConnectionConfiguration({ id });

    this.data.splice(this.data.findIndex(connection => connection.id === id), 1);
  }

  protected async loader(id?: string): Promise<ConnectionInfo[]> {
    const { connections } = await this.graphQLService.gql.getConnections();

    return connections as ConnectionInfo[];
  }
}
