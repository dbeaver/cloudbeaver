/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed, observable } from 'mobx';
import { Subject } from 'rxjs';

import { injectable } from '@dbeaver/core/di';
import { SessionService } from '@dbeaver/core/root';
import {
  ConnectionInfo,
  DataSourceInfo,
  DriverInfo,
  GraphQLService,
  CachedResource,
  DatabaseObjectInfo,
} from '@dbeaver/core/sdk';

import { NodesManagerService } from '../NodesManager/NodesManagerService';

export type DBDriver = Pick<
  DriverInfo,
  | 'id'
  | 'name'
  | 'icon'
  | 'description'
  | 'defaultPort'
  | 'sampleURL'
  | 'embedded'
  | 'anonymousAccess'
  | 'promotedScore'
>
export type DBSource = Pick<DataSourceInfo, 'id' | 'name' | 'driverId' | 'description'>
export type Connection = Pick<ConnectionInfo, 'id' | 'name' | 'connected' | 'driverId'>
export type ObjectContainer = Pick<DatabaseObjectInfo, 'name' | 'description' | 'type' | 'features'>

@injectable()
export class ConnectionsManagerService {

  @observable private connectionsMap: Map<string, Connection> = new Map();
  readonly dbDrivers = new CachedResource(new Map(), this.refreshDriversAsync.bind(this));
  readonly connectionObjectContainers = new CachedResource(new Map(), this.refreshObjectContainersAsync.bind(this));

  @computed get connections(): Connection[] {
    return Array.from(this.connectionsMap.values());
  }

  onOpenConnection = new Subject<Connection>();
  onCloseConnection = new Subject<string>();

  constructor(private graphQLService: GraphQLService,
              private nodesManagerService: NodesManagerService,
              private sessionService: SessionService) {
  }

  getDBDrivers(): Map<string, DBDriver> {
    return this.dbDrivers.data;
  }

  async loadDriversAsync(): Promise<Map<string, DBDriver>> {
    return this.dbDrivers.load();
  }

  addOpenedConnection(connection: Connection) {
    this.connectionsMap.set(connection.id, connection);
    this.onOpenConnection.next(connection);
    this.nodesManagerService.updateRootChildren(); // Update connections list, probably here we must also request node info and add it to nodes manager
  }

  getConnectionById(connectionId: string): Connection | undefined {
    return this.connectionsMap.get(connectionId);
  }

  getObjectContainerById(
    connectionId: string,
    objectCatalogId: string,
    objectSchemaId?: string
  ): ObjectContainer | undefined {
    const objectContainers = this.connectionObjectContainers.data.get(connectionId);
    if (!objectContainers) {
      return;
    }
    return objectContainers.find(
      objectContainer => objectContainer.name === objectSchemaId || objectContainer.name === objectCatalogId
    );
  }

  hasAnyConnection(): boolean {
    return Boolean(this.connections.length);
  }

  async closeAllConnections(): Promise<void> {
    for (const connection of this.connections) {
      await this.closeConnectionAsync(connection.id, true);
    }
    await this.nodesManagerService.updateRootChildren();
  }

  async closeConnectionAsync(id: string, skipNodesRefresh?: boolean): Promise<void> {
    await this.nodesManagerService.closeConnection(id);
    this.onCloseConnection.next(id);
    await this.graphQLService.gql.closeConnection({ id });
    this.connectionsMap.delete(id);

    if (!skipNodesRefresh) {
      await this.nodesManagerService.updateRootChildren(); // Update connections list, probably here we must just remove nodes from nodes manager
    }
  }

  async loadObjectContainer(connectionId: string, catalogId?: string): Promise<ObjectContainer[]> {
    const data = await this.connectionObjectContainers.load(connectionId, catalogId);
    return data.get(connectionId)!;
  }

  async restoreConnections() {
    const config = await this.sessionService.session.load();
    if (!config) {
      return;
    }

    // TODO: connections must be string[]
    for (const connection of config.connections) {
      await this.restoreConnection(connection);
    }
    await this.nodesManagerService.updateRootChildren();
  }

  private async refreshObjectContainersAsync(
    data: Map<string, ObjectContainer[]>,
    refresh: boolean,
    connectionId: string,
    catalogId?: string,
  ): Promise<Map<string, ObjectContainer[]>> {
    if (refresh || !data.has(connectionId)) {
      const { navGetStructContainers } = await this.graphQLService.gql.navGetStructContainers({
        connectionId,
        catalogId,
      });
      data.set(connectionId, [...navGetStructContainers.schemaList, ...navGetStructContainers.catalogList]);
    }

    return data;
  }

  private async refreshDriversAsync(data: Map<string, DBDriver>): Promise<Map<string, DBDriver>> {
    const { driverList } = await this.graphQLService.gql.driverList();

    data.clear();

    for (const driver of driverList) {
      data.set(driver.id, driver);
    }

    return data;
  }

  private async restoreConnection(connection: Connection) {
    // TODO: Must be loaded based on connection id
    // const { connection } = await this.graphQLService.gql.connectionState({ id });

    this.connectionsMap.set(connection.id, connection);
    this.onOpenConnection.next(connection);
  }
}
