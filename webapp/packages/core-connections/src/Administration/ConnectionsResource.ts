/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, makeObservable } from 'mobx';
import { Observable, Subject } from 'rxjs';

import { EAdminPermission } from '@cloudbeaver/core-administration';
import { AUTH_PROVIDER_LOCAL_ID } from '@cloudbeaver/core-authentication';
import { injectable } from '@cloudbeaver/core-di';
import { PermissionsResource, SessionDataResource } from '@cloudbeaver/core-root';
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
  resourceKeyList,
  ResourceKeyList,
} from '@cloudbeaver/core-sdk';
import { MetadataMap } from '@cloudbeaver/core-utils';

export const NEW_CONNECTION_SYMBOL = Symbol('new-connection');

export type DatabaseConnection = DatabaseConnectionFragment;
export type NewConnection = DatabaseConnectionFragment & { [NEW_CONNECTION_SYMBOL]: boolean; timestamp: number };

@injectable()
export class ConnectionsResource extends CachedMapResource<string, DatabaseConnection, GetConnectionsQueryVariables> {
  static keyAll = resourceKeyList(['all'], 'all');
  readonly onConnectionCreate: Observable<DatabaseConnection>;

  private changed: boolean;
  private loadedKeyMetadata: MetadataMap<string, boolean>;
  private connectionCreateSubject: Subject<DatabaseConnection>;

  constructor(
    private graphQLService: GraphQLService,
    private permissionsResource: PermissionsResource,
    sessionDataResource: SessionDataResource
  ) {
    super(['includeOrigin', 'customIncludeNetworkHandlerCredentials', 'includeAuthProperties']);

    makeObservable(this, {
      add: action,
    });

    sessionDataResource.onDataUpdate.addHandler(() => this.markOutdated());

    this.changed = false;
    this.connectionCreateSubject = new Subject<DatabaseConnection>();
    this.onConnectionCreate = this.connectionCreateSubject.asObservable();
    this.loadedKeyMetadata = new MetadataMap(() => false);

    this.addAlias(ConnectionsResource.keyAll, key => {
      if (this.keys.length > 0) {
        return resourceKeyList(this.keys, ConnectionsResource.keyAll.mark);
      }
      return ConnectionsResource.keyAll;
    });
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

  async refreshAll(): Promise<DatabaseConnection[]> {
    this.resetIncludes();
    await this.refresh(ConnectionsResource.keyAll);
    return this.values;
  }

  async loadAll(): Promise<DatabaseConnection[]> {
    this.resetIncludes();
    await this.load(ConnectionsResource.keyAll);
    return this.values;
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
    if (!(await this.permissionsResource.hasAsync(EAdminPermission.admin))) {
      return this.data;
    }

    const all = ResourceKeyUtils.hasMark(key, ConnectionsResource.keyAll.mark);

    await ResourceKeyUtils.forEachAsync(all ? ConnectionsResource.keyAll : key, async key => {
      const { connections } = await this.graphQLService.sdk.getConnections({
        id: !all ? key : undefined,
        ...this.getDefaultIncludes(),
        ...this.getIncludesMap(undefined, includes),
      });

      if (all) {
        this.resetIncludes();
        this.data.clear();
      }

      this.updateConnection(...connections);

      if (all) {
        this.loadedKeyMetadata.set(ConnectionsResource.keyAll.list[0], true);
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

  private updateConnection(...connections: DatabaseConnection[]): ResourceKeyList<string> {
    const key = resourceKeyList(connections.map(connection => connection.id));

    const oldConnection = this.get(key);
    this.set(key, oldConnection.map((connection, i) => ({ ...connection, ...connections[i] })));

    return key;
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
  if (!connection.origin) {
    return false;
  }
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
