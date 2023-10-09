/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed, makeObservable } from 'mobx';

import { ConfirmationDialogDelete, ProcessSnackbar } from '@cloudbeaver/core-blocks';
import { injectable } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { Executor, ExecutorInterrupter, IExecutor } from '@cloudbeaver/core-executor';
import { ProjectInfo, projectInfoSortByName, ProjectsService } from '@cloudbeaver/core-projects';
import { isArraysEqual } from '@cloudbeaver/core-utils';

import { Connection, ConnectionInfoResource, createConnectionParam, isConnectionInfoParamEqual } from './ConnectionInfoResource';
import { ContainerResource, IStructContainers, ObjectContainer } from './ContainerResource';
import type { IConnectionInfoParams } from './IConnectionsResource';

export interface IConnectionExecutorData {
  connections: IConnectionInfoParams[];
  state: 'before' | 'after';
}

@injectable()
export class ConnectionsManagerService {
  get projectConnections(): Connection[] {
    return this.connectionInfo.values.filter(connection => this.projectsService.activeProjects.some(project => project.id === connection.projectId));
  }
  get createConnectionProjects(): ProjectInfo[] {
    return this.projectsService.activeProjects.filter(project => project.canEditDataSources).sort(projectInfoSortByName);
  }
  readonly connectionExecutor: IExecutor<IConnectionInfoParams>;
  readonly onDisconnect: IExecutor<IConnectionExecutorData>;
  readonly onDelete: IExecutor<IConnectionExecutorData>;

  private disconnecting: boolean;

  constructor(
    readonly connectionInfo: ConnectionInfoResource,
    readonly containerContainers: ContainerResource,
    private readonly notificationService: NotificationService,
    private readonly commonDialogService: CommonDialogService,
    private readonly projectsService: ProjectsService,
  ) {
    this.disconnecting = false;

    this.connectionExecutor = new Executor<IConnectionInfoParams>(null, isConnectionInfoParamEqual);
    this.onDisconnect = new Executor();
    this.onDelete = new Executor();

    this.connectionExecutor.addHandler(key => connectionInfo.load(key));
    this.onDelete.before(this.onDisconnect);

    makeObservable(this, {
      projectConnections: computed<Connection[]>({
        equals: isArraysEqual,
      }),
      createConnectionProjects: computed<ProjectInfo[]>({
        equals: isArraysEqual,
      }),
    });
  }

  async requireConnection(key: IConnectionInfoParams): Promise<Connection | null> {
    const context = await this.connectionExecutor.execute(key);
    const connection = context.getContext(this.connectionContext);

    return connection.connection;
  }

  addOpenedConnection(connection: Connection): void {
    this.connectionInfo.add(connection);
  }

  getObjectContainerById(connectionKey: IConnectionInfoParams, objectCatalogId?: string, objectSchemaId?: string): ObjectContainer | undefined {
    if (objectCatalogId) {
      const objectContainers = this.containerContainers.getCatalogData(connectionKey, objectCatalogId);

      if (!objectContainers) {
        return;
      }

      if (!objectSchemaId) {
        return objectContainers.catalog;
      }

      return objectContainers.schemaList.find(objectContainer => objectContainer.name === objectSchemaId);
    }

    if (objectSchemaId) {
      return this.containerContainers.getSchema(connectionKey, objectSchemaId);
    }

    return undefined;
  }

  async deleteConnection(key: IConnectionInfoParams): Promise<void> {
    const connection = await this.connectionInfo.load(key);

    if (!connection.canDelete) {
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

    const contexts = await this.onDelete.execute({
      connections: [key],
      state: 'before',
    });

    if (ExecutorInterrupter.isInterrupted(contexts)) {
      return;
    }

    await this.connectionInfo.deleteConnection(key);

    this.onDelete.execute({
      connections: [key],
      state: 'after',
    });
  }

  hasAnyConnection(connected?: boolean): boolean {
    if (connected) {
      return this.projectConnections.some(connection => connection.connected);
    }
    return !!this.projectConnections.length;
  }

  connectionContext() {
    return {
      connection: null as Connection | null,
    };
  }

  private async _closeConnectionAsync(connection: Connection) {
    if (!connection.connected) {
      return;
    }
    await this.connectionInfo.close(createConnectionParam(connection));
  }

  async closeAllConnections(): Promise<void> {
    if (this.disconnecting) {
      return;
    }
    this.disconnecting = true;
    const { controller, notification } = this.notificationService.processNotification(() => ProcessSnackbar, {}, { title: 'Disconnecting...' });

    try {
      for (const connection of this.projectConnections) {
        await this._closeConnectionAsync(connection);
      }
      notification.close();
    } catch (e: any) {
      controller.reject(e);
    } finally {
      this.disconnecting = false;
    }
  }

  async closeConnectionAsync(key: IConnectionInfoParams): Promise<void> {
    const connection = this.connectionInfo.get(key);
    if (!connection || !connection.connected) {
      return;
    }
    const contexts = await this.onDisconnect.execute({
      connections: [createConnectionParam(connection)],
      state: 'before',
    });

    if (ExecutorInterrupter.isInterrupted(contexts)) {
      return;
    }

    const { controller, notification } = this.notificationService.processNotification(() => ProcessSnackbar, {}, { title: 'Disconnecting...' });

    try {
      await this._closeConnectionAsync(connection);

      notification.close();
      this.onDisconnect.execute({
        connections: [createConnectionParam(connection)],
        state: 'after',
      });
    } catch (exception: any) {
      controller.reject(exception);
    }
  }

  async loadObjectContainer(key: IConnectionInfoParams, catalogId?: string): Promise<IStructContainers> {
    await this.containerContainers.load({ projectId: key.projectId, connectionId: key.connectionId, catalogId });
    return this.containerContainers.get({ projectId: key.projectId, connectionId: key.connectionId, catalogId })!;
  }
}
