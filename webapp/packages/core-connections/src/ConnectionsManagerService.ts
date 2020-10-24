/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Subject } from 'rxjs';

import { injectable } from '@cloudbeaver/core-di';
import { CommonDialogService, ConfirmationDialog, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';

import { ConnectionAuthService } from './ConnectionAuthService';
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
    private notificationService: NotificationService,
    private connectionAuthService: ConnectionAuthService,
    private commonDialogService: CommonDialogService
  ) {
  }

  async requireConnection(connectionId?: string) {
    if (!connectionId) {
      if (!this.hasAnyConnection()) {
        return null;
      }
      connectionId = Array.from(this.connectionInfo.data.values())[0].id;
    }

    try {
      const connection = await this.connectionAuthService.auth(connectionId);

      if (!connection.connected) {
        return null;
      }

      return connection;
    } catch (exception) {
      this.notificationService.logException(exception);
      throw exception;
    }
  }

  async addOpenedConnection(connection: Connection) {
    this.addConnection(connection);
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
    const connection = await this.connectionInfo.load(id);

    if (!connection.features.includes(EConnectionFeature.manageable)) {
      return;
    }

    const result = await this.commonDialogService.open(ConfirmationDialog, {
      title: 'app_shared_navigationTree_delete_connection_confirm',
      message: `You're going to delete ${connection.name} connection. Are you sure?`,
      confirmActionText: 'ui_delete',
    });
    if (result === DialogueStateResult.Rejected) {
      return;
    }

    await this.connectionInfo.deleteConnection(id);
    await this.afterConnectionClose(id);
  }

  hasAnyConnection(connected?: boolean): boolean {
    if (connected) {
      return Array.from(this.connectionInfo.data.values()).some(connection => connection.connected);
    }
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
    } catch (exception) {
      this.notificationService.logException(exception, "Can't close connection", `Can't close connection: ${connection.name}`);
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

  private addConnection(connection: Connection) {
    this.connectionInfo.set(connection.id, connection);
    this.onOpenConnection.next(connection);
  }
}
