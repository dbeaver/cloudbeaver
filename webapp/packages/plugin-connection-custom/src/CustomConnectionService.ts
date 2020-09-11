/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ConnectionsManagerService, Connection } from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import { ConnectionConfig, GraphQLService } from '@cloudbeaver/core-sdk';

@injectable()
export class CustomConnectionService {

  constructor(
    private graphQLService: GraphQLService,
    private connectionsManagerService: ConnectionsManagerService,
  ) {
  }

  async createConnectionAsync(config: ConnectionConfig): Promise<Connection> {
    const response = await this.graphQLService.sdk.createConnection({
      config,
    });

    this.connectionsManagerService.addOpenedConnection(response.createConnection);

    return response.createConnection;
  }

  async testConnectionAsync(config: ConnectionConfig): Promise<void> {
    await this.graphQLService.sdk.testConnection({
      config,
    });
  }
}
