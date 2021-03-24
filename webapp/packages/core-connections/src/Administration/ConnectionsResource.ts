/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, makeObservable } from 'mobx';
import { Observable, Subject } from 'rxjs';

import { AUTH_PROVIDER_LOCAL_ID } from '@cloudbeaver/core-authentication';
import { injectable } from '@cloudbeaver/core-di';
import {
  GraphQLService,
  ConnectionConfig,
  CachedMapResource,
  ResourceKey,
  AdminConnectionGrantInfo,
  AdminConnectionSearchInfo,
  ResourceKeyUtils,
  DatabaseConnectionFragment,
  GetConnectionsQueryVariables,
  TestConnectionMutation,
} from '@cloudbeaver/core-sdk';
import { MetadataMap } from '@cloudbeaver/core-utils';

export const NEW_CONNECTION_SYMBOL = Symbol('new-connection');

export type DatabaseConnection = DatabaseConnectionFragment;
export type NewConnection = DatabaseConnectionFragment & { [NEW_CONNECTION_SYMBOL]: boolean; timestamp: number };

const allKey = 'all';

@injectable()
export class ConnectionsResource extends CachedMapResource<string, DatabaseConnection, GetConnectionsQueryVariables> {
  readonly onConnectionCreate: Observable<DatabaseConnection>;

  private changed: boolean;
  private loadedKeyMetadata: MetadataMap<string, boolean>;
  private connectionCreateSubject: Subject<DatabaseConnection>;

  constructor(
    private graphQLService: GraphQLService
  ) {
    super(['includeOrigin', 'customIncludeNetworkHandlerCredentials', 'includeAuthProperties']);

    makeObservable(this, {
      add: action,
    });

    this.changed = false;
    this.connectionCreateSubject = new Subject<DatabaseConnection>();
    this.onConnectionCreate = this.connectionCreateSubject.asObservable();
    this.loadedKeyMetadata = new MetadataMap(() => false);
  }

  has(id: string): boolean {
    if (this.loadedKeyMetadata.has(id)) {
      return this.loadedKeyMetadata.get(id);
    }

    return this.data.has(id);
  }

  getEmptyConfig(): ConnectionConfig {
    return {
      template: false,
      saveCredentials: false,
    };
  }

  async refreshAll(): Promise<Map<string, DatabaseConnection>> {
    this.resetIncludes();
    await this.refresh(allKey);
    return this.data;
  }

  async loadAll(): Promise<Map<string, DatabaseConnection>> {
    this.resetIncludes();
    await this.load(allKey);
    return this.data;
  }

  async searchDatabases(hosts: string[]): Promise<AdminConnectionSearchInfo[]> {
    const { databases } = await this.graphQLService.sdk.searchDatabases({ hosts });

    return databases;
  }

  async create(config: ConnectionConfig): Promise<DatabaseConnection> {
    const { connection } = await this.graphQLService.sdk.createConnectionConfiguration({
      config,
      ...this.getDefaultIncludes(),
      ...this.getIncludesMap(config.connectionId),
    });

    return this.add(connection, true);
  }

  async createConnectionFromNode(nodeId: string, name: string): Promise<DatabaseConnection> {
    const { connection } = await this.graphQLService.sdk.createConnectionConfigurationFromNode({
      nodePath: nodeId,
      config: { name },
      ...this.getDefaultIncludes(),
      ...this.getIncludesMap(),
    });

    return this.add(connection, true);
  }

  add(connection: DatabaseConnection, isNew = false): DatabaseConnection {
    this.changed = true;

    const newConnection: NewConnection = {
      ...connection,
      [NEW_CONNECTION_SYMBOL]: isNew,
      timestamp: Date.now(),
    };
    this.updateConnection(newConnection);

    const observedConnection = this.get(connection.id)!;
    this.connectionCreateSubject.next(observedConnection);
    return observedConnection;
  }

  async test(config: ConnectionConfig): Promise<TestConnectionMutation['connection']> {
    const { connection } = await this.graphQLService.sdk.testConnection({
      config,
    });

    return connection;
  }

  async update(id: string, config: ConnectionConfig): Promise<DatabaseConnection> {
    await this.performUpdate(id, [], async () => {
      const { connection } = await this.graphQLService.sdk.updateConnectionConfiguration({
        id,
        config,
        ...this.getDefaultIncludes(),
        ...this.getIncludesMap(id),
      });

      this.updateConnection(connection);
    });
    this.changed = true;
    return this.get(id)!;
  }

  async delete(key: ResourceKey<string>): Promise<void> {
    await this.performUpdate(key, [], () => this.deleteConnectionTask(key));
    this.changed = true;
  }

  async updateSessionConnections(): Promise<boolean> {
    if (!this.changed) {
      return false;
    }

    await this.graphQLService.sdk.refreshSessionConnections();
    this.changed = false;
    return true;
  }

  async loadAccessSubjects(connectionId: string): Promise<AdminConnectionGrantInfo[]> {
    const subjects = await this.performUpdate(connectionId, [], async () => {
      const { subjects } = await this.graphQLService.sdk.getConnectionAccess({
        connectionId,
      });
      return subjects;
    });

    return subjects;
  }

  async setAccessSubjects(connectionId: string, subjects: string[]): Promise<void> {
    await this.graphQLService.sdk.setConnectionAccess({ connectionId, subjects });
  }

  cleanNewFlags(): void {
    for (const connection of this.data.values()) {
      (connection as NewConnection)[NEW_CONNECTION_SYMBOL] = false;
    }
  }

  protected async loader(key: ResourceKey<string>, includes: string[]): Promise<Map<string, DatabaseConnection>> {
    await ResourceKeyUtils.forEachAsync(key, async key => {
      const { connections } = await this.graphQLService.sdk.getConnections({
        id: key !== allKey ? key : undefined,
        ...this.getDefaultIncludes(),
        ...this.getIncludesMap(undefined, includes),
      });

      if (key === allKey) {
        this.data.clear();
      }

      for (const connection of connections) {
        this.updateConnection(connection);
      }

      if (key === allKey) {
        // TODO: driverList must accept driverId, so we can update some drivers or all drivers,
        //       here we should check is it's was a full update
        this.loadedKeyMetadata.set(allKey, true);
      }
    });

    return this.data;
  }

  private async deleteConnectionTask(key: ResourceKey<string>) {
    await ResourceKeyUtils.forEachAsync(key, key => this.deleteConnection(key));
    await this.onItemDelete.execute(key);
  }

  private async deleteConnection(connectionId: string) {
    if (!this.data.has(connectionId)) {
      return;
    }

    await this.graphQLService.sdk.deleteConnectionConfiguration({ id: connectionId });
    this.data.delete(connectionId);
  }

  private updateConnection(connection: DatabaseConnection) {
    const oldConnection = this.get(connection.id) || {};
    this.set(connection.id, { ...oldConnection, ...connection });
  }

  private getDefaultIncludes(): GetConnectionsQueryVariables {
    return {
      customIncludeNetworkHandlerCredentials: false,
      customIncludeOriginDetails: false,
      includeAuthProperties: false,
      includeOrigin: false,
    };
  }
}

export function isLocalConnection(connection: DatabaseConnection): boolean {
  if (!connection.origin) {
    return true;
  }
  return connection.origin.type === AUTH_PROVIDER_LOCAL_ID;
}

export function isCloudConnection(connection: DatabaseConnection): boolean {
  return connection.origin.type === 'cloud';
}

export function isNewConnection(connection: DatabaseConnection | NewConnection): connection is NewConnection {
  return (connection as NewConnection)[NEW_CONNECTION_SYMBOL];
}

export function compareConnections(a: DatabaseConnection, b: DatabaseConnection): number {
  if (isNewConnection(a) && isNewConnection(b)) {
    return b.timestamp - a.timestamp;
  }

  if (isNewConnection(b)) {
    return 1;
  }

  if (isNewConnection(a)) {
    return -1;
  }

  return a.name.localeCompare(b.name);
}
