/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ProcessSnackbar } from '@cloudbeaver/core-blocks';
import { injectable } from '@cloudbeaver/core-di';
import { CommonDialogService, ConfirmationDialogDelete, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { Executor, IExecutor } from '@cloudbeaver/core-executor';
import { CachedMapAllKey } from '@cloudbeaver/core-sdk';

import { ConnectionInfoResource, Connection } from './ConnectionInfoResource';
import { ContainerResource, IStructContainers, ObjectContainer } from './ContainerResource';
import { EConnectionFeature } from './EConnectionFeature';

@injectable()
export class ConnectionsManagerService {
  readonly connectionExecutor: IExecutor<string | null>;

  private disconnecting: boolean;

  constructor(
    readonly connectionInfo: ConnectionInfoResource,
    readonly containerContainers: ContainerResource,
    private readonly notificationService: NotificationService,
    private readonly commonDialogService: CommonDialogService
  ) {
    this.disconnecting = false;
    this.connectionExecutor = new Executor<string | null>(null, (active, current) => active === current);
    this.connectionExecutor.addHandler(() => connectionInfo.load(CachedMapAllKey));
  }

  async requireConnection(connectionId: string | null = null): Promise<Connection | null> {
    try {
      const context = await this.connectionExecutor.execute(connectionId);
      const connection = context.getContext(this.connectionContext);

      return connection.connection;
    } catch {
      return null;
    }
  }

  async addOpenedConnection(connection: Connection): Promise<void> {
    this.addConnection(connection);
  }

  getObjectContainerById(
    connectionId: string,
    objectCatalogId?: string,
    objectSchemaId?: string
  ): ObjectContainer | undefined {
    if (objectCatalogId) {
      const objectContainers = this.containerContainers.getCatalogData(connectionId, objectCatalogId);

      if (!objectContainers) {
        return;
      }

      if (!objectSchemaId) {
        return objectContainers.catalog;
      }

      return objectContainers.schemaList.find(
        objectContainer => objectContainer.name === objectSchemaId
      );
    }

    if (objectSchemaId) {
      return this.containerContainers.getSchema(connectionId, objectSchemaId);
    }

    return undefined;
  }

  async deleteConnection(id: string): Promise<void> {
    const connection = await this.connectionInfo.load(id);

    if (!connection.features.includes(EConnectionFeature.manageable)) {
      return;
    }

    const result = await this.commonDialogService.open(ConfirmationDialogDelete, {
      title: 'ui_data_delete_confirmation',
      message: `You're going to delete "${connection.name}" connection. Are you sure?`,
      confirmActionText: 'ui_delete',
    });
    if (result === DialogueStateResult.Rejected) {
      return;
    }

    await this.connectionInfo.deleteConnection(id);
  }

  hasAnyConnection(connected?: boolean): boolean {
    if (connected) {
      return this.connectionInfo.values.some(connection => connection.connected);
    }
    return !!this.connectionInfo.values.length;
  }

  connectionContext() {
    return {
      connection: null as (Connection | null),
    };
  }

  private async _closeConnectionAsync(connection: Connection) {
    if (!connection.connected) {
      return;
    }
    await this.connectionInfo.close(connection.id);
  }

  async closeAllConnections(): Promise<void> {
    if (this.disconnecting) {
      return;
    }
    this.disconnecting = true;
    const { controller, notification } = this.notificationService.processNotification(() => ProcessSnackbar, {}, { title: 'Disconnecting...' });

    try {
      for (const connection of this.connectionInfo.values) {
        await this._closeConnectionAsync(connection);
      }
      notification.close();
    } catch (e: any) {
      controller.reject(e);
    } finally {
      this.disconnecting = false;
    }
  }

  async closeConnectionAsync(id: string): Promise<void> {
    const connection = this.connectionInfo.get(id);
    if (!connection || !connection.connected) {
      return;
    }
    const { controller, notification } = this.notificationService.processNotification(() => ProcessSnackbar, {}, { title: 'Disconnecting...' });

    try {
      await this._closeConnectionAsync(connection);
      notification.close();
    } catch (exception: any) {
      controller.reject(exception);
    }
  }

  async loadObjectContainer(connectionId: string, catalogId?: string): Promise<IStructContainers> {
    await this.containerContainers.load({ connectionId, catalogId });
    return this.containerContainers.get({ connectionId, catalogId })!;
  }

  private addConnection(connection: Connection) {
    this.connectionInfo.set(connection.id, connection);
  }
}
