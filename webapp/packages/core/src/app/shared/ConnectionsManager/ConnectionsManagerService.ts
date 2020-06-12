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
import { NotificationService } from '@dbeaver/core/eventsLog';
import { SessionService } from '@dbeaver/core/root';
import {
  ConnectionInfo,
  DataSourceInfo,
  DriverInfo,
  GraphQLService,
  CachedResource,
  DatabaseObjectInfo,
} from '@dbeaver/core/sdk';
import { MetadataMap } from '@dbeaver/core/utils';

import { NavNodeManagerService } from '../NodesManager/NavNodeManagerService';
import { NodeManagerUtils } from '../NodesManager/NodeManagerUtils';
import { EConnectionFeature } from './EConnectionFeature';

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
export type Connection = Pick<ConnectionInfo, 'id' | 'name' | 'connected' | 'driverId' | 'features'>
export type ObjectContainer = Pick<DatabaseObjectInfo, 'name' | 'description' | 'type' | 'features'>

type ConnectionLoadArgs = {
  connectionId: string;
  close?: boolean;
  remove?: boolean;
  connection?: never;
}

type ConnectionSetArgs = {
  connection: Connection;
  connectionId?: never;
  remove?: never;
  close?: never;
}

type DBDriversMetadata = {
  loaded: boolean;
}

type ConnectionInfoMetadata = {
  loading: boolean;
  loaded: boolean;
}

@injectable()
export class ConnectionsManagerService {
  readonly dbDrivers = new CachedResource(
    new Map(),
    this.refreshDriversAsync.bind(this),
    (_, { loaded }) => loaded,
    { loaded: false }
  );
  readonly connectionInfo = new CachedResource(
    new Map(),
    this.loadConnectionInfo.bind(this),
    (_, metadata, args) => metadata.get(args.connectionId || args.connection!.id).loaded,
    new MetadataMap<string, ConnectionInfoMetadata>(() => ({ loaded: false, loading: false })),
    (_, metadata, args) => metadata.get(args.connectionId || args.connection!.id).loading
  );
  readonly connectionObjectContainers = new CachedResource(
    new Map(),
    this.refreshObjectContainersAsync.bind(this),
    this.isObjectContainersLoaded.bind(this)
  );

  @computed get connections(): Connection[] {
    return Array.from(this.connectionInfo.data.values());
  }

  onOpenConnection = new Subject<Connection>();
  onCloseConnection = new Subject<string>();

  constructor(
    private graphQLService: GraphQLService,
    private navNodeManagerService: NavNodeManagerService,
    private sessionService: SessionService,
    private notificationService: NotificationService
  ) {
    this.sessionService.onUpdate.subscribe(this.restoreConnections.bind(this));
  }

  getDBDrivers(): Map<string, DBDriver> {
    return this.dbDrivers.data;
  }

  async loadConnectionInfoAsync(connectionId: string): Promise<Connection> {
    const connections = await this.connectionInfo.load({ connectionId });

    return connections.get(connectionId)!;
  }

  async refreshConnectionInfoAsync(connectionId: string): Promise<Connection> {
    const connections = await this.connectionInfo.refresh(true, { connectionId });

    return connections.get(connectionId)!;
  }

  async loadDriversAsync(): Promise<Map<string, DBDriver>> {
    return this.dbDrivers.load();
  }

  async addOpenedConnection(connection: Connection) {
    await this.connectionInfo.refresh(
      true,
      {
        connection,
      }
    );
    this.onOpenConnection.next(connection);
    await this.navNodeManagerService.updateRootChildren(); // Update connections list, probably here we must also request node info and add it to nodes manager
  }

  getConnectionById(connectionId: string): Connection | undefined {
    return this.connectionInfo.data.get(connectionId);
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
    await this.navNodeManagerService.updateRootChildren();
  }

  async closeConnectionAsync(id: string, skipNodesRefresh?: boolean): Promise<void> {
    await this.graphQLService.gql.closeConnection({ id });
    await this.afterConnectionClose(id);
    await this.connectionInfo.refresh(true, { connectionId: id, close: true });

    if (!skipNodesRefresh) {
      await this.navNodeManagerService.updateRootChildren(); // Update connections list, probably here we must just remove nodes from nodes manager
    }
  }

  async closeNavNodeConnectionAsync(navNodeId: string): Promise<void> {
    const node = this.navNodeManagerService.getNode(navNodeId);
    if (!node) {
      return;
    }

    try {
      const connectionId = NodeManagerUtils.connectionNodeIdToConnectionId(navNodeId);
      await this.graphQLService.gql.closeConnection({ id: connectionId });
      await this.afterConnectionClose(connectionId);
      await this.connectionInfo.refresh(true, { connectionId, close: true });

      if (node.objectFeatures.includes('dataSourceTemporary')) {
      } else {
        await this.navNodeManagerService.refreshNode(navNodeId);
      }
      await this.navNodeManagerService.removeTree(navNodeId);
    } catch (exception) {
      this.notificationService.logException(exception, `Can't close connection: ${navNodeId}`);
    }
  }

  async loadObjectContainer(connectionId: string, catalogId?: string): Promise<ObjectContainer[]> {
    const data = await this.connectionObjectContainers.load(connectionId, catalogId);
    return data.get(connectionId)!;
  }

  private async afterConnectionClose(id: string) {
    await this.navNodeManagerService.removeTree(id);
    this.onCloseConnection.next(id);
  }

  private async restoreConnections() {
    const config = await this.sessionService.session.load();
    if (!config) {
      return;
    }

    let connectionsToRemove = this.connections.concat();
    // TODO: connections must be string[]
    for (const connection of config.connections) {
      await this.restoreConnection(connection);
      connectionsToRemove = connectionsToRemove.filter(({ id }) => id !== connection.id);
    }

    for (const connection of connectionsToRemove) {
      await this.afterConnectionClose(connection.id);
      await this.connectionInfo.refresh(true, {
        connectionId: connection.id,
        remove: true,
      });
    }

    await this.navNodeManagerService.updateRootChildren();
  }

  private isObjectContainersLoaded(
    data: Map<string, ObjectContainer[]>,
    metadata: {},
    connectionId: string,
    catalogId?: string,
  ) {
    return data.has(connectionId);
  }

  private async refreshObjectContainersAsync(
    data: Map<string, ObjectContainer[]>,
    metadata: {},
    update: boolean,
    connectionId: string,
    catalogId?: string,
  ): Promise<Map<string, ObjectContainer[]>> {
    const { navGetStructContainers } = await this.graphQLService.gql.navGetStructContainers({
      connectionId,
      catalogId,
    });
    data.set(connectionId, [...navGetStructContainers.schemaList, ...navGetStructContainers.catalogList]);

    return data;
  }

  private async refreshDriversAsync(
    data: Map<string, DBDriver>,
    metadata: DBDriversMetadata,
    update: boolean
  ): Promise<Map<string, DBDriver>> {
    const { driverList } = await this.graphQLService.gql.driverList();

    data.clear();

    for (const driver of driverList) {
      data.set(driver.id, driver);
    }
    metadata.loaded = true;
    return data;
  }

  private async loadConnectionInfo(
    data: Map<string, Connection>,
    metadata: MetadataMap<string, ConnectionInfoMetadata>,
    load: boolean,
    args: ConnectionLoadArgs | ConnectionSetArgs,
  ): Promise<Map<string, Connection>> {
    let connectionId: string;
    if (args.connection) {
      connectionId = args.connection.id;
    } else {
      connectionId = args.connectionId;
    }
    const connectionInfo = data.get(connectionId);

    const itemMetadata = metadata.get(connectionId);

    if (args.connection) {
      data.set(connectionId, args.connection);
      itemMetadata.loaded = true;
      return data;
    }

    if (args.remove || (args.close && connectionInfo?.features.includes(EConnectionFeature.temporary))) {
      data.delete(connectionId);
      metadata.delete(connectionId);
      return data;
    }


    if (load) {
      try {
        itemMetadata.loading = true;
        const { connection } = await this.graphQLService.gql.connectionState({ id: connectionId });

        data.set(connectionId, connection);
        itemMetadata.loaded = true;
      } finally {
        itemMetadata.loading = false;
      }
    }

    return data;
  }

  private async restoreConnection(connection: Connection) {
    await this.connectionInfo.refresh(
      true,
      {
        connection,
      }
    );
    this.onOpenConnection.next(connection);
  }
}
