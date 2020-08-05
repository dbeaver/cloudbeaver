/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Subject } from 'rxjs';

import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { SessionResource } from '@cloudbeaver/core-root';
import { isResourceKeyList } from '@cloudbeaver/core-sdk';

import { ROOT_NODE_PATH } from '../NodesManager/NavNodeInfoResource';
import { NavNodeManagerService } from '../NodesManager/NavNodeManagerService';
import { NodeManagerUtils } from '../NodesManager/NodeManagerUtils';
import { ConnectionInfoResource, Connection } from './ConnectionInfoResource';
import { ContainerResource, ObjectContainer } from './ContainerResource';
import { EConnectionFeature } from './EConnectionFeature';

@injectable()
export class ConnectionsManagerService {
  onOpenConnection = new Subject<Connection>();
  onCloseConnection = new Subject<string>();

  constructor(
    readonly connectionInfo: ConnectionInfoResource,
    readonly connectionObjectContainers: ContainerResource,
    private navNodeManagerService: NavNodeManagerService,
    private sessionResource: SessionResource,
    private notificationService: NotificationService
  ) {
    this.sessionResource.onDataUpdate.subscribe(this.restoreConnections.bind(this));
    this.connectionInfo.onItemAdd.subscribe(async (key) => {
      if (isResourceKeyList(key)) {
        for (const id of key.list) {
          const nodeId = NodeManagerUtils.connectionIdToConnectionNodeId(id);
          this.navNodeManagerService
            .markTreeOutdated(nodeId);
        }
        return;
      }
      const nodeId = NodeManagerUtils.connectionIdToConnectionNodeId(key);
      this.navNodeManagerService
        .markTreeOutdated(nodeId);
    });
  }

  async addOpenedConnection(connection: Connection) {
    this.addConnection(connection);

    const nodeId = NodeManagerUtils.connectionIdToConnectionNodeId(connection.id);
    await this.navNodeManagerService.refreshNode(nodeId);

    this.navNodeManagerService.navTree.unshiftToNode(ROOT_NODE_PATH, [nodeId]);
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
    const connection = this.connectionInfo.get(id);

    if (!connection?.features.includes(EConnectionFeature.temporary)) {
      return;
    }

    await this.connectionInfo.deleteConnection(id);
    await this.afterConnectionClose(id);

    const navNodeId = NodeManagerUtils.connectionIdToConnectionNodeId(id);

    const node = this.navNodeManagerService.getNode(navNodeId);
    if (!node) {
      return;
    }
    this.navNodeManagerService.navTree.deleteInNode(node.parentId, [navNodeId]);
  }

  hasAnyConnection(): boolean {
    return !!Array.from(this.connectionInfo.data.values()).length;
  }

  async closeAllConnections(): Promise<void> {
    for (const connection of this.connectionInfo.data.values()) {
      await this.closeConnectionAsync(connection.id);
    }
  }

  async closeConnectionAsync(id: string): Promise<void> {
    const connection = this.connectionInfo.get(id);
    if (!connection) {
      return;
    }

    try {
      await this.connectionInfo.close(id);
      await this.afterConnectionClose(id);

      const navNodeId = NodeManagerUtils.connectionIdToConnectionNodeId(id);

      this.navNodeManagerService.removeTree(navNodeId);
      await this.navNodeManagerService.refreshNode(navNodeId);
    } catch (exception) {
      this.notificationService.logException(exception, `Can't close connection: ${connection.name}`);
    }
  }

  async deleteNavNodeConnectionAsync(navNodeId: string): Promise<void> {
    await this.deleteConnection(NodeManagerUtils.connectionNodeIdToConnectionId(navNodeId));
  }

  async closeNavNodeConnectionAsync(navNodeId: string): Promise<void> {
    const connectionId = NodeManagerUtils.connectionNodeIdToConnectionId(navNodeId);
    await this.closeConnectionAsync(connectionId);
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

    const restoredConnections = new Set<string>();
    // TODO: connections must be string[]
    for (const connection of config.connections) {
      this.addConnection(connection);
      restoredConnections.add(connection.id);
    }

    const unrestoredConnectionIdList = Array.from(this.connectionInfo.data.values())
      .map(connection => connection.id)
      .filter(connectionId => !restoredConnections.has(connectionId));

    for (const connectionId of unrestoredConnectionIdList) {
      await this.afterConnectionClose(connectionId);
      this.connectionInfo.delete(connectionId);
    }

    await this.navNodeManagerService.updateRootChildren();
  }

  private addConnection(connection: Connection) {
    this.connectionInfo.set(connection.id, connection);
    this.onOpenConnection.next(connection);
  }
}
