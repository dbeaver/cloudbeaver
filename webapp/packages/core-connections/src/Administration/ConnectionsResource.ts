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
  ConnectionInfo,
  ConnectionConfig,
  CachedMapResource,
  ResourceKey,
  isResourceKeyList,
  AdminConnectionGrantInfo,
  AdminConnectionSearchInfo,
  ObjectPropertyInfo,
} from '@cloudbeaver/core-sdk';
import { uuid, MetadataMap } from '@cloudbeaver/core-utils';

import { DBDriverResource } from '../DBDriverResource';

export const NEW_CONNECTION_SYMBOL = Symbol('new-connection');
export const SEARCH_CONNECTION_SYMBOL = Symbol('search-connection');

export type ConnectionNew = ConnectionInfo & { [NEW_CONNECTION_SYMBOL]: boolean }
export type ConnectionSearch = ConnectionNew & { [SEARCH_CONNECTION_SYMBOL]: AdminConnectionSearchInfo }

@injectable()
export class ConnectionsResource extends CachedMapResource<string, ConnectionInfo> {
  private metadata: MetadataMap<string, boolean>;

  constructor(
    private graphQLService: GraphQLService,
    private dbDriverResource: DBDriverResource
  ) {
    super(new Map());
    this.metadata = new MetadataMap(() => false);
  }

  has(id: string) {
    if (this.metadata.has(id)) {
      return this.metadata.get(id);
    }

    return this.data.has(id);
  }

  isNew(id: string) {
    if (!this.has(id)) {
      return false;
    }
    return NEW_CONNECTION_SYMBOL in this.get(id)!;
  }

  isSearched(id: string) {
    return isSearchedConnection(this.get(id));
  }

  addNew(driverId: string) {
    const connectionInfo = {
      id: uuid(),
      driverId,
      authProperties: [] as Array<ObjectPropertyInfo>,
      // name: 'New connection',
      [NEW_CONNECTION_SYMBOL]: true,
    } as ConnectionNew;

    this.data.set(connectionInfo.id, connectionInfo);
    this.markUpdated(connectionInfo.id);

    return connectionInfo;
  }

  async loadAll() {
    await this.load('all');
    return this.data;
  }

  async searchDatabases(hosts: string[]) {
    const { databases } = await this.graphQLService.sdk.searchDatabases({ hosts });

    return databases;
  }

  async create(config: ConnectionConfig) {
    const { connection } = await this.graphQLService.sdk.createConnectionConfiguration({ config });
    await this.graphQLService.sdk.refreshSessionConnections();

    const newConnection: ConnectionNew = {
      ...connection as ConnectionInfo,
      [NEW_CONNECTION_SYMBOL]: true,
    };
    this.set(newConnection.id, newConnection);

    return this.get(connection.id)!;
  }

  async test(config: ConnectionConfig): Promise<void> {
    await this.graphQLService.sdk.testConnection({
      config,
    });
  }

  async update(id: string, config: ConnectionConfig) {
    await this.performUpdate(id, () => this.updateConnection(id, config));
    await this.graphQLService.sdk.refreshSessionConnections();
    return this.get(id)!;
  }

  async delete(key: ResourceKey<string>) {
    await this.performUpdate(key, () => this.deleteConnectionTask(key));
    await this.graphQLService.sdk.refreshSessionConnections();
  }

  async loadAccessSubjects(connectionId: string): Promise<AdminConnectionGrantInfo[]> {
    if (this.isNew(connectionId)) {
      return [];
    }

    const { subjects } = await this.graphQLService.sdk.getConnectionAccess({ connectionId });

    return subjects;
  }

  async setAccessSubjects(connectionId: string, subjects: string[]) {
    await this.graphQLService.sdk.setConnectionAccess({ connectionId, subjects });
  }

  protected async loader(key: ResourceKey<string>): Promise<Map<string, ConnectionInfo>> {
    const { connections } = await this.graphQLService.sdk.getConnections();
    this.data.clear();

    for (const connection of connections) {
      this.set(connection.id, connection as ConnectionInfo);
    }
    this.markUpdated(key);

    // TODO: getConnections must accept connectionId, so we can update some connection or all connections,
    //       here we should check is it's was a full update
    this.metadata.set('all', true);

    return this.data;
  }

  private async getNameTemplate(connection: AdminConnectionSearchInfo) {
    const driver = await this.dbDriverResource.load(connection.defaultDriver);

    return `${driver.name} (${connection.host}:${connection.port})`;
  }

  private async deleteConnectionTask(key: ResourceKey<string>) {
    if (isResourceKeyList(key)) {
      for (let i = 0; i < key.list.length; i++) {
        await this.deleteConnection(key.list[i]);
      }
    } else {
      await this.deleteConnection(key);
    }
    this.itemDeleteSubject.next(key);
  }

  private async deleteConnection(connectionId: string) {
    if (!this.data.has(connectionId)) {
      return;
    }

    const isNew = this.isNew(connectionId);
    this.data.delete(connectionId);

    if (!isNew) {
      await this.graphQLService.sdk.deleteConnectionConfiguration({ id: connectionId });
    }
  }

  private async updateConnection(id: string, config: ConnectionConfig) {
    const { connection } = await this.graphQLService.sdk.updateConnectionConfiguration({ id, config });

    this.set(id, connection as ConnectionInfo);
  }
}

export function isSearchedConnection(
  connection: ConnectionInfo | undefined
): connection is ConnectionSearch {
  return !!connection && SEARCH_CONNECTION_SYMBOL in connection;
}
