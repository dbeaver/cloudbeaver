/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, makeObservable } from 'mobx';

import { AppAuthService } from '@cloudbeaver/core-authentication';
import { injectable } from '@cloudbeaver/core-di';
import { Executor, ExecutorInterrupter, IExecutor } from '@cloudbeaver/core-executor';
import { SessionResource } from '@cloudbeaver/core-root';
import {
  UserConnectionFragment,
  GraphQLService,
  CachedMapResource,
  ConnectionConfig,
  UserConnectionAuthPropertiesFragment,
  resourceKeyList,
  InitConnectionMutationVariables,
} from '@cloudbeaver/core-sdk';

import { ConnectionsResource } from './Administration/ConnectionsResource';
import { CONNECTION_NAVIGATOR_VIEW_SETTINGS } from './ConnectionNavigatorViewSettings';

export type Connection = UserConnectionFragment & { authProperties?: UserConnectionAuthPropertiesFragment[] };
export type ConnectionInitConfig = InitConnectionMutationVariables;

@injectable()
export class ConnectionInfoResource extends CachedMapResource<string, Connection> {
  readonly onConnectionCreate: IExecutor<Connection>;
  readonly onConnectionClose: IExecutor<Connection>;
  private sessionUpdate: boolean;
  constructor(
    private graphQLService: GraphQLService,
    private connectionsResource: ConnectionsResource,
    appAuthService: AppAuthService,
    sessionResource: SessionResource
  ) {
    super(new Map());

    makeObservable(this, {
      refreshSession: action,
      createFromTemplate: action,
      createConnection: action,
      createFromNode: action,
      add: action,
    });

    this.onConnectionCreate = new Executor();
    this.onConnectionClose = new Executor();
    this.sessionUpdate = false;

    // in case when session was refreshed all data depended on connection info
    // should be refreshed by session update executor
    // it's prevents double nav tree refresh
    this.onItemAdd.addHandler(ExecutorInterrupter.interrupter(() => !this.sessionUpdate));
    this.onItemDelete.addHandler(ExecutorInterrupter.interrupter(() => !this.sessionUpdate));
    this.onConnectionCreate.addHandler(ExecutorInterrupter.interrupter(() => !this.sessionUpdate));
    sessionResource.onDataOutdated.addHandler(() => this.markOutdated());
    appAuthService.auth.addHandler(() => this.refreshSession(true));
  }

  async refreshSession(sessionUpdate?: boolean): Promise<void> {
    this.sessionUpdate = sessionUpdate === true;
    try {
      const connectionsList = resourceKeyList(Array.from(this.data.keys()));
      await this.performUpdate(connectionsList, async () => {
        if (!sessionUpdate) {
          const updated = await this.connectionsResource.updateSessionConnections();

          if (!updated) {
            return;
          }
        }

        const { state: { connections } } = await this.graphQLService.sdk.getSessionConnections();

        const restoredConnections = new Set<string>();

        for (const connection of connections) {
          await this.add(connection);
          restoredConnections.add(connection.id);
        }

        const unrestoredConnectionIdList = Array.from(this.data.values())
          .map(connection => connection.id)
          .filter(connectionId => !restoredConnections.has(connectionId));

        this.delete(resourceKeyList(unrestoredConnectionIdList));
      });
    } finally {
      this.sessionUpdate = false;
    }
  }

  async createFromTemplate(templateId: string): Promise<Connection> {
    const { connection } = await this.graphQLService.sdk.createConnectionFromTemplate({ templateId });
    return this.add(connection);
  }

  async createConnection(config: ConnectionConfig): Promise<Connection> {
    const { connection } = await this.graphQLService.sdk.createConnection({
      config,
    });
    return this.add(connection);
  }

  async createFromNode(nodeId: string, nodeName: string): Promise<Connection> {
    const { connection } = await this.graphQLService.sdk.createConnectionFromNode({
      nodePath: nodeId,
      config: { name: nodeName },
    });

    return this.add(connection);
  }

  async add(connection: Connection): Promise<Connection> {
    const exists = this.data.has(connection.id);
    this.set(connection.id, connection);

    const observedConnection = this.get(connection.id)!;

    if (!exists) {
      await this.onConnectionCreate.execute(observedConnection);
    }

    return observedConnection;
  }

  async init(config: ConnectionInitConfig): Promise<Connection> {
    await this.performUpdate(config.id, async () => {
      const connection = await this.initConnection(config);
      this.set(config.id, connection);
    });

    return this.get(config.id)!;
  }

  async changeConnectionView(id: string, simple: boolean): Promise<Connection> {
    await this.performUpdate(id, async () => {
      const settings = simple ? CONNECTION_NAVIGATOR_VIEW_SETTINGS.simple : CONNECTION_NAVIGATOR_VIEW_SETTINGS.advanced;

      const { connection } = await this.graphQLService.sdk.setConnectionNavigatorSettings({
        id,
        settings,
      });

      this.set(id, connection);
    });

    return this.get(id)!;
  }

  async close(connectionId: string): Promise<Connection> {
    await this.performUpdate(connectionId, async () => {
      const connection = await this.closeConnection(connectionId);
      this.set(connectionId, connection);
    });

    const connection = this.get(connectionId)!;
    await this.onConnectionClose.execute(connection);
    return connection;
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

  private async initConnection(config: ConnectionInitConfig): Promise<Connection> {
    const { connection } = await this.graphQLService.sdk.initConnection({ ...config });

    return connection;
  }

  private async closeConnection(id: string): Promise<Connection> {
    const { connection } = await this.graphQLService.sdk.closeConnection({ id });

    return connection;
  }
}
