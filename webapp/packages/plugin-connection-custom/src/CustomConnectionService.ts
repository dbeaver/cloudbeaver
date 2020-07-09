/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ConnectionsManagerService, Connection } from '@cloudbeaver/core-app';
import { injectable } from '@cloudbeaver/core-di';
import { ConnectionConfig, GraphQLService, ObjectPropertyInfo } from '@cloudbeaver/core-sdk';

@injectable()
export class CustomConnectionService {

  constructor(
    private graphQLService: GraphQLService,
    private connectionsManagerService: ConnectionsManagerService,
  ) {
  }

  async loadDriverProperties(driverId: string): Promise<ObjectPropertyInfo[]> {
    const response = await this.graphQLService.gql.driverProperties({
      driverId,
    });

    if (response.driver.length === 0) {
      throw new Error('Driver properties loading failed');
    }

    return response.driver[0].driverProperties! as ObjectPropertyInfo[];
  }

  async createConnectionAsync(config: ConnectionConfig): Promise<Connection> {
    const response = await this.graphQLService.gql.createConnection({
      config,
    });

    this.connectionsManagerService.addOpenedConnection(response.createConnection);

    return response.createConnection;
  }

  async testConnectionAsync(config: ConnectionConfig): Promise<void> {
    await this.graphQLService.gql.testConnection({
      config,
    });
  }
}
