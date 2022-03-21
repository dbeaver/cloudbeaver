/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { AuthProviderService } from '@cloudbeaver/core-authentication';
import { Connection, ConnectionInfoResource, ConnectionsManagerService } from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import { CommonDialogService } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';

import { DatabaseAuthDialog } from './DatabaseAuthDialog/DatabaseAuthDialog';

@injectable()
export class ConnectionAuthService {
  constructor(
    private readonly connectionInfoResource: ConnectionInfoResource,
    private readonly commonDialogService: CommonDialogService,
    private readonly authProviderService: AuthProviderService,
    private readonly connectionsManagerService: ConnectionsManagerService,
    private readonly notificationService: NotificationService,
  ) {
    connectionsManagerService.connectionExecutor.addHandler(this.connectionDialog.bind(this));
  }

  private async connectionDialog(connectionId: string | null, context: IExecutionContextProvider<string | null>) {
    const connection = context.getContext(this.connectionsManagerService.connectionContext);

    if (!connectionId) {
      if (!this.connectionsManagerService.hasAnyConnection()) {
        return;
      }
      connectionId = this.connectionInfoResource.values[0].id;
    }

    try {
      const tempConnection = await this.auth(connectionId);

      if (!tempConnection?.connected) {
        return;
      }
      connection.connection = tempConnection;
    } catch (exception: any) {
      this.notificationService.logException(exception);
      throw exception;
    }
  }

  async auth(connectionId: string): Promise<Connection | null> {
    if (!this.connectionInfoResource.has(connectionId)) {
      return null;
    }

    let connection = this.connectionInfoResource.get(connectionId);

    if (!connection?.connected) {
      connection = await this.connectionInfoResource.refresh(connectionId);
    } else {
      return connection;
    }

    if (connection.connected) {
      return connection;
    }

    if (connection.origin) {
      const state = await this.authProviderService.requireProvider(connection.origin);

      if (!state) {
        return connection;
      }
    }

    connection = await this.connectionInfoResource.load(connectionId);

    const networkHandlers = connection.networkHandlersConfig
      .filter(handler => handler.enabled && !handler.savePassword)
      .map(handler => handler.id);

    if (connection.authNeeded || networkHandlers.length > 0) {
      await this.commonDialogService.open(DatabaseAuthDialog, {
        connectionId,
        networkHandlers,
      });
    } else {
      await this.connectionInfoResource.init({ id: connectionId });
    }

    return this.connectionInfoResource.get(connectionId)!;
  }
}
