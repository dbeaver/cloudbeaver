/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { Executor, IExecutor } from '@cloudbeaver/core-executor';
import { SessionResource } from '@cloudbeaver/core-root';
import {
  UserConnectionFragment,
  GraphQLService,
  CachedMapResource,
  ConnectionConfig,
  UserConnectionAuthPropertiesFragment
} from '@cloudbeaver/core-sdk';

export type Connection = UserConnectionFragment & { authProperties?: UserConnectionAuthPropertiesFragment[] };

@injectable()
export class ConnectionInfoResource extends CachedMapResource<string, Connection> {
  readonly onConnectionCreate: IExecutor<Connection>;
  constructor(
    private graphQLService: GraphQLService,
    sessionResource: SessionResource
  ) {
    super(new Map());
    this.onConnectionCreate = new Executor();
    sessionResource.onDataUpdate.addHandler(() => this.refreshSession(true));
  }

  @action async refreshSession(sessionUpdate?: boolean): Promise<void> {
    const { state: { connections } } = await this.graphQLService.sdk.getSessionConnections();

    const restoredConnections = new Set<string>();
    for (const connection of connections) {
      await this.add(connection, sessionUpdate);
      restoredConnections.add(connection.id);
    }

    const unrestoredConnectionIdList = Array.from(this.data.values())
      .map(connection => connection.id)
      .filter(connectionId => !restoredConnections.has(connectionId));

    for (const connectionId of unrestoredConnectionIdList) {
      this.delete(connectionId);
    }
  }

  @action async createFromTemplate(templateId: string): Promise<Connection> {
    const { connection } = await this.graphQLService.sdk.createConnectionFromTemplate({ templateId });
    return this.add(connection);
  }

  @action async createConnection(config: ConnectionConfig): Promise<Connection> {
    const { connection } = await this.graphQLService.sdk.createConnection({
      config,
    });
    return this.add(connection);
  }

  @action async createFromNode(nodeId: string): Promise<Connection> {
    const { connection } = await this.graphQLService.sdk.createConnectionFromNode({ nodePath: nodeId });

    return this.add(connection);
  }

  @action async add(connection: Connection, update?: boolean): Promise<Connection> {
    const exists = this.data.has(connection.id);
    this.set(connection.id, connection);

    const observedConnection = this.get(connection.id)!;

    if (!update && !exists) {
      await this.onConnectionCreate.execute(observedConnection);
    }

    return observedConnection;
  }

  async init(id: string, credentials?: Record<string, any>, saveCredentials?: boolean): Promise<Connection> {
    await this.performUpdate(id, async () => {
      const connection = await this.initConnection(id, credentials, saveCredentials);
      this.set(id, connection);
      return connection;
    });

    return this.get(id)!;
  }

  async close(connectionId: string): Promise<Connection> {
    await this.performUpdate(connectionId, async () => {
      const connection = await this.closeConnection(connectionId);
      this.set(connectionId, connection);
    });

    return this.get(connectionId)!;
  }

  async deleteConnection(connectionId: string): Promise<void> {
    await this.performUpdate(connectionId, async () => {
      await this.graphQLService.sdk.deleteConnection({ id: connectionId });
    });
    this.delete(connectionId);
  }

  async loadAuthModel(connectionId: string): Promise<UserConnectionAuthPropertiesFragment[]> {
    const connection = await this.load(connectionId);

    if (connection?.authProperties) {
      return connection.authProperties;
    }

    return this.performUpdate(connectionId, async () => {
      connection.authProperties = await this.getAuthProperties(connectionId);
      this.set(connectionId, connection);

      return connection.authProperties!;
    });
  }

  protected async loader(connectionId: string): Promise<Map<string, Connection>> {
    const { connection } = await this.graphQLService.sdk.connectionInfo({ id: connectionId });

    const oldConnection = this.get(connectionId) || {};
    this.set(connectionId, { ...oldConnection, ...connection });

    return this.data;
  }

  private async getAuthProperties(id: string): Promise<UserConnectionAuthPropertiesFragment[]> {
    const { connection: { authProperties } } = await this.graphQLService.sdk.connectionAuthProperties({ id });

    return authProperties;
  }

  private async initConnection(id: string, credentials?: any, saveCredentials?: boolean): Promise<Connection> {
    const { connection } = await this.graphQLService.sdk.initConnection({ id, credentials, saveCredentials });

    return connection;
  }

  private async closeConnection(id: string): Promise<Connection> {
    const { connection } = await this.graphQLService.sdk.closeConnection({ id });

    return connection;
  }
}
