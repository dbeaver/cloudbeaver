/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import {
  ConnectionInfo,
  GraphQLService,
  CachedMapResource,
  ObjectPropertyInfo
} from '@cloudbeaver/core-sdk';

export type Connection = Pick<ConnectionInfo, 'id' | 'name' | 'description' | 'connected' | 'driverId' | 'features' | 'authModel' | 'authNeeded'> & { authProperties?: ObjectPropertyInfo[] }

@injectable()
export class ConnectionInfoResource extends CachedMapResource<string, Connection> {
  constructor(private graphQLService: GraphQLService) {
    super(new Map());
  }

  async init(id: string, credentials?: any): Promise<Connection> {
    const connection = await this.performUpdate(id, async () => {
      const connection = await this.setActivePromise(id, this.initConnection(id, credentials));
      this.set(id, connection);
      return connection;
    });

    return this.get(id)!;
  }

  async close(connectionId: string) {
    await this.performUpdate(connectionId, async () => {
      const connection = await this.setActivePromise(connectionId, this.closeConnection(connectionId));
      this.set(connectionId, connection);
    });

    return this.get(connectionId)!;
  }

  async deleteConnection(connectionId: string) {
    await this.performUpdate(connectionId, async () => {
      await this.graphQLService.gql.deleteConnection({ id: connectionId });
    });
    this.delete(connectionId);
  }

  async loadAuthModel(connectionId: string): Promise<ObjectPropertyInfo[]> {
    const connection = await this.load(connectionId);

    if (connection?.authProperties) {
      return connection.authProperties;
    }

    return this.performUpdate(connectionId, async () => {
      connection.authProperties = await this.setActivePromise(connectionId, this.getAuthProperties(connectionId));
      this.set(connectionId, connection);

      return connection.authProperties!;
    });
  }

  protected async loader(connectionId: string): Promise<Map<string, Connection>> {
    const { connection } = await this.graphQLService.gql.connectionState({ id: connectionId });

    const oldConnection = this.get(connectionId) || {};
    this.set(connectionId, { ...oldConnection, ...connection });

    return this.data;
  }

  private async getAuthProperties(id: string): Promise<ObjectPropertyInfo[]> {
    const { connection: { authProperties } } = await this.graphQLService.gql.connectionAuthProperties({ id });

    return authProperties;
  }

  private async initConnection(id: string, credentials?: any): Promise<Connection> {
    const { connection } = await this.graphQLService.gql.initConnection({ id, credentials });

    return connection;
  }

  private async closeConnection(id: string): Promise<Connection> {
    const { connection } = await this.graphQLService.gql.closeConnection({ id });

    return connection;
  }
}
