/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed } from 'mobx';
import { Subject } from 'rxjs';

import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { SessionResource } from '@cloudbeaver/core-root';
import { DataSourceInfo, GraphQLService } from '@cloudbeaver/core-sdk';

import { ROOT_NODE_PATH } from '../NodesManager/NavNodeInfoResource';
import { NavNodeManagerService } from '../NodesManager/NavNodeManagerService';
import { NodeManagerUtils } from '../NodesManager/NodeManagerUtils';
import { ConnectionInfoResource, Connection } from './ConnectionInfoResource';
import { ContainerResource, ObjectContainer } from './ContainerResource';
import { DBDriverResource, DBDriver } from './DBDriverResource';
import { EConnectionFeature } from './EConnectionFeature';

export type DBSource = Pick<DataSourceInfo, 'id' | 'name' | 'driverId' | 'description'>

@injectable()
export class ConnectionsManagerService {
  @computed get connections(): Connection[] {
    return Array.from(this.connectionInfo.data.values());
  }

  onOpenConnection = new Subject<Connection>();
  onCloseConnection = new Subject<string>();

  constructor(
    private graphQLService: GraphQLService,
    readonly connectionInfo: ConnectionInfoResource,
    readonly connectionObjectContainers: ContainerResource,
    readonly dbDrivers: DBDriverResource,
    private navNodeManagerService: NavNodeManagerService,
    private sessionResource: SessionResource,
    private notificationService: NotificationService
  ) {
    this.sessionResource.onDataUpdate.subscribe(this.restoreConnections.bind(this));
  }

  getDBDrivers(): Map<string, DBDriver> {
    return this.dbDrivers.data;
  }

  async loadConnectionInfoAsync(connectionId: string): Promise<Connection> {
    return this.connectionInfo.load(connectionId);
  }

  async refreshConnectionInfoAsync(connectionId: string): Promise<Connection> {
    return this.connectionInfo.refresh(connectionId);
  }

  async loadDriversAsync(): Promise<Map<string, DBDriver>> {
    await this.dbDrivers.load('');
    return this.dbDrivers.data;
  }

  async addOpenedConnection(connection: Connection) {
    this.connectionInfo.set(connection.id, connection);
    this.onOpenConnection.next(connection);

    const nodeId = NodeManagerUtils.connectionIdToConnectionNodeId(connection.id);
    await this.navNodeManagerService.loadNode({ nodeId, parentId: ROOT_NODE_PATH });

    this.navNodeManagerService.navTree.unshiftToNode(ROOT_NODE_PATH, [nodeId]);
  }

  getConnectionById(connectionId: string): Connection | undefined {
    return this.connectionInfo.get(connectionId);
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

  async deleteConnection(id: string) {
    const connection = this.getConnectionById(id);

    if (!connection?.features.includes(EConnectionFeature.temporary)) {
      return;
    }

    await this.graphQLService.gql.deleteConnection({ id });
    await this.afterConnectionClose(id);
    this.connectionInfo.delete(id);

    const navNodeId = NodeManagerUtils.connectionIdToConnectionNodeId(id);

    const node = this.navNodeManagerService.getNode(navNodeId);
    if (!node) {
      return;
    }
    this.navNodeManagerService.navTree.deleteInNode(node.parentId, [navNodeId]);
  }

  hasAnyConnection(): boolean {
    return !!this.connections.length;
  }

  async closeAllConnections(): Promise<void> {
    for (const connection of this.connections) {
      await this.closeConnectionAsync(connection.id, true);
    }
    await this.navNodeManagerService.updateRootChildren();
  }

  async closeConnectionAsync(id: string, skipNodesRefresh?: boolean): Promise<void> {
    const connectionUpdatedInfo = await this.graphQLService.gql.closeConnection({ id });
    this.connectionInfo.set(connectionUpdatedInfo.connection.id, connectionUpdatedInfo.connection);

    await this.afterConnectionClose(id);

    if (!skipNodesRefresh) {
      await this.navNodeManagerService.updateRootChildren(); // Update connections list, probably here we must just remove nodes from nodes manager
    }
  }

  async deleteNavNodeConnectionAsync(navNodeId: string): Promise<void> {
    await this.deleteConnection(NodeManagerUtils.connectionNodeIdToConnectionId(navNodeId));
  }

  async closeNavNodeConnectionAsync(navNodeId: string): Promise<void> {
    const connectionId = NodeManagerUtils.connectionNodeIdToConnectionId(navNodeId);
    const connection = this.getConnectionById(connectionId);
    if (!connection) {
      return;
    }

    try {
      const connectionUpdatedInfo = await this.graphQLService.gql.closeConnection({ id: connectionId });
      this.connectionInfo.set(connectionUpdatedInfo.connection.id, connectionUpdatedInfo.connection);

      await this.afterConnectionClose(connectionId);

      this.navNodeManagerService.removeTree(navNodeId);
      await this.navNodeManagerService.refreshNode(navNodeId);
    } catch (exception) {
      this.notificationService.logException(exception, `Can't close connection: ${navNodeId}`);
    }
  }

  async loadObjectContainer(connectionId: string, catalogId?: string): Promise<ObjectContainer[]> {
    await this.connectionObjectContainers.load({ connectionId, catalogId });
    return this.connectionObjectContainers.data.get(connectionId)!;
  }

  private async afterConnectionClose(id: string) {
    // this.navNodeManagerService.removeTree(id);
    this.onCloseConnection.next(id);
  }

  private async restoreConnections() {
    const config = await this.sessionResource.load(null);
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
      this.connectionInfo.delete(connection.id);
    }

    await this.navNodeManagerService.updateRootChildren();
  }

  private async restoreConnection(connection: Connection) {
    this.connectionInfo.set(connection.id, connection);
    this.onOpenConnection.next(connection);
  }
}
