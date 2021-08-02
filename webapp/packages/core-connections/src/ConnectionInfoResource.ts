/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, makeObservable, runInAction } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { Executor, ExecutorInterrupter, IExecutor } from '@cloudbeaver/core-executor';
import { NavigatorViewSettings, SessionDataResource } from '@cloudbeaver/core-root';
import {
  GraphQLService,
  CachedMapResource,
  ConnectionConfig,
  UserConnectionAuthPropertiesFragment,
  resourceKeyList,
  InitConnectionMutationVariables,
  GetUserConnectionsQueryVariables,
  ResourceKey,
  ResourceKeyUtils,
  TestConnectionMutation,
  NavigatorSettingsInput,
  ResourceKeyList,
} from '@cloudbeaver/core-sdk';

import { ConnectionsResource, DatabaseConnection } from './Administration/ConnectionsResource';

export type Connection = DatabaseConnection & { authProperties?: UserConnectionAuthPropertiesFragment[] };
export type ConnectionInitConfig = Omit<InitConnectionMutationVariables, 'includeOrigin' | 'customIncludeOriginDetails' | 'includeAuthProperties' | 'customIncludeNetworkHandlerCredentials'>;
export type ConnectionInfoIncludes = Omit<GetUserConnectionsQueryVariables, 'id'>;

export const DEFAULT_NAVIGATOR_VIEW_SETTINGS: NavigatorSettingsInput = {
  showOnlyEntities: false,
  hideFolders: false,
  hideVirtualModel: false,
  hideSchemas: false,
  mergeEntities: false,
  showSystemObjects: false,
  showUtilityObjects: false,
};

@injectable()
export class ConnectionInfoResource extends CachedMapResource<string, Connection, ConnectionInfoIncludes> {
  readonly onConnectionCreate: IExecutor<Connection>;
  readonly onConnectionClose: IExecutor<Connection>;

  private sessionUpdate: boolean;
  constructor(
    private graphQLService: GraphQLService,
    private connectionsResource: ConnectionsResource,
    sessionDataResource: SessionDataResource
  ) {
    super();

    makeObservable(this, {
      refreshUserConnections: action,
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
    // this.onItemAdd.addHandler(ExecutorInterrupter.interrupter(() => this.sessionUpdate));
    this.onItemDelete.addHandler(ExecutorInterrupter.interrupter(() => this.sessionUpdate));
    this.onConnectionCreate.addHandler(ExecutorInterrupter.interrupter(() => this.sessionUpdate));

    sessionDataResource.onDataOutdated.addHandler(() => this.markOutdated());
    sessionDataResource.onDataUpdate.addHandler(() => this.refreshUserConnections(true));
  }

  async refreshUserConnections(sessionUpdate?: boolean): Promise<void> {
    this.sessionUpdate = sessionUpdate === true;
    try {
      const connectionsList = resourceKeyList(Array.from(this.data.keys()));
      await this.performUpdate(connectionsList, [], async () => {
        if (!sessionUpdate) {
          const updated = await this.connectionsResource.updateSessionConnections();

          if (!updated) {
            return;
          }
        }

        this.resetIncludes();
        const { connections } = await this.graphQLService.sdk.getUserConnections({
          ...this.getDefaultIncludes(),
          ...this.getIncludesMap(),
        });

        runInAction(() => {
          const unrestoredConnectionIdList = Array.from(this.data.values())
            .map(connection => connection.id)
            .filter(connectionId => !connections.some(connection => connection.id === connectionId));

          this.delete(resourceKeyList(unrestoredConnectionIdList));
        });

        await this.addList(connections);
      });
    } finally {
      this.sessionUpdate = false;
    }
  }

  async createFromTemplate(templateId: string, connectionName: string): Promise<Connection> {
    const { connection } = await this.graphQLService.sdk.createConnectionFromTemplate({
      templateId,
      connectionName,
      ...this.getDefaultIncludes(),
      ...this.getIncludesMap(),
    });
    return this.add(connection);
  }

  async createConnection(config: ConnectionConfig): Promise<Connection> {
    const { connection } = await this.graphQLService.sdk.createConnection({
      config,
      ...this.getDefaultIncludes(),
      ...this.getIncludesMap(config.connectionId),
    });
    return this.add(connection);
  }

  async testConnection(config: ConnectionConfig): Promise<TestConnectionMutation['connection']> {
    const { connection } = await this.graphQLService.sdk.testConnection({
      config,
    });

    return connection;
  }

  async createFromNode(nodeId: string, nodeName: string): Promise<Connection> {
    const { connection } = await this.graphQLService.sdk.createConnectionFromNode({
      nodePath: nodeId,
      config: { name: nodeName },
      ...this.getDefaultIncludes(),
      ...this.getIncludesMap(),
    });

    return this.add(connection);
  }

  async addList(connections: Connection[]): Promise<Connection[]> {
    const newConnections = connections.filter(connection => !this.data.has(connection.id));
    const key = this.updateConnection(...connections);

    for (const connection of newConnections) {
      await this.onConnectionCreate.execute(this.get(connection.id)!);
    }

    return this.get(key) as Connection[];
  }

  async add(connection: Connection): Promise<Connection> {
    const exists = this.data.has(connection.id);
    this.updateConnection(connection);

    const observedConnection = this.get(connection.id)!;

    if (!exists) {
      await this.onConnectionCreate.execute(observedConnection);
    }

    return observedConnection;
  }

  async init(config: ConnectionInitConfig): Promise<Connection> {
    await this.performUpdate(config.id, [], async () => {
      const { connection } = await this.graphQLService.sdk.initConnection({
        ...config,
        ...this.getDefaultIncludes(),
        ...this.getIncludesMap(),
      });
      this.updateConnection(connection);
    });

    return this.get(config.id)!;
  }

  async changeConnectionView(id: string, settings: NavigatorViewSettings): Promise<Connection> {
    await this.performUpdate(id, [], async () => {
      const connectionNavigatorViewSettings = this.get(id)?.navigatorSettings || DEFAULT_NAVIGATOR_VIEW_SETTINGS;
      const { connection } = await this.graphQLService.sdk.setConnectionNavigatorSettings({
        id,
        settings: { ...connectionNavigatorViewSettings, ...settings },
        ...this.getDefaultIncludes(),
        ...this.getIncludesMap(id),
      });

      this.updateConnection(connection);
    });

    return this.get(id)!;
  }

  async update(config: ConnectionConfig): Promise<DatabaseConnection> {
    await this.performUpdate(config.connectionId!, [], async () => {
      const { connection } = await this.graphQLService.sdk.updateConnection({
        config,
        ...this.getDefaultIncludes(),
        ...this.getIncludesMap(config.connectionId!),
      });

      this.updateConnection(connection);
    });
    return this.get(config.connectionId!)!;
  }

  async close(id: string): Promise<Connection> {
    await this.performUpdate(id, [], async () => {
      const { connection } = await this.graphQLService.sdk.closeConnection({
        id,
        ...this.getDefaultIncludes(),
        ...this.getIncludesMap(id),
      });

      this.updateConnection(connection);
    });

    const connection = this.get(id)!;
    await this.onConnectionClose.execute(connection);
    return connection;
  }

  async deleteConnection(id: string): Promise<void> {
    await this.performUpdate(id, [], async () => {
      await this.graphQLService.sdk.deleteConnection({ id: id });
    });
    this.delete(id);
  }

  protected async loader(key: ResourceKey<string>, includes: string[]): Promise<Map<string, Connection>> {
    await ResourceKeyUtils.forEachAsync(key, async key => {
      const { connections } = await this.graphQLService.sdk.getUserConnections({
        id: key,
        ...this.getDefaultIncludes(),
        ...this.getIncludesMap(key, includes),
      });

      this.updateConnection(...connections);
    });

    return this.data;
  }

  private updateConnection(...connections: Connection[]): ResourceKeyList<string> {
    const key = resourceKeyList(connections.map(connection => connection.id));

    const oldConnection = this.get(key);
    this.set(key, oldConnection.map((connection, i) => ({ ...connection, ...connections[i] })));

    return key;
  }

  private getDefaultIncludes(): ConnectionInfoIncludes {
    return {
      customIncludeNetworkHandlerCredentials: false,
      customIncludeOriginDetails: false,
      includeAuthProperties: false,
      includeOrigin: true,
    };
  }
}

export function compareConnectionsInfo(a: DatabaseConnection, b: DatabaseConnection): number {
  return (a.name).localeCompare(b.name);
}
