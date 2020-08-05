/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Connection, ConnectionsManagerService } from '@cloudbeaver/core-app';
import { injectable } from '@cloudbeaver/core-di';
import { ConnectionConfig, GraphQLService } from '@cloudbeaver/core-sdk';

@injectable()
export class TemplateConnectionService {

  constructor(
    private graphQLService: GraphQLService,
    private connectionsManagerService: ConnectionsManagerService
  ) {
  }

  async openConnectionAsync(config: ConnectionConfig): Promise<Connection> {
    const { connection } = await this.graphQLService.gql.openConnection({ config });
    this.connectionsManagerService.addOpenedConnection(connection);
    return connection;
  }
}
