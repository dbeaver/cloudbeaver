/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { AuthProviderService } from '@cloudbeaver/core-authentication';
import { Connection, ConnectionInfoResource, ConnectionsManagerService, createConnectionParam, IConnectionInfoParams } from '@cloudbeaver/core-connections';
import { Dependency, injectable } from '@cloudbeaver/core-di';
import { CommonDialogService } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';
import { AuthenticationService } from '@cloudbeaver/plugin-authentication';

import { DatabaseAuthDialog } from './DatabaseAuthDialog/DatabaseAuthDialog';

@injectable()
export class ConnectionAuthService extends Dependency {
  constructor(
    private readonly connectionInfoResource: ConnectionInfoResource,
    private readonly commonDialogService: CommonDialogService,
    private readonly authProviderService: AuthProviderService,
    private readonly connectionsManagerService: ConnectionsManagerService,
    private readonly notificationService: NotificationService,
    private readonly authenticationService: AuthenticationService,
  ) {
    super();

    connectionsManagerService.connectionExecutor.addHandler(this.connectionDialog.bind(this));
    this.authenticationService.onLogout.before(connectionsManagerService.onDisconnect, state => ({
      connections: connectionInfoResource.values
        .filter(connection => connection.connected)
        .map(createConnectionParam),
      state,
    }));
  }

  private async connectionDialog(
    connectionKey: IConnectionInfoParams | null,
    context: IExecutionContextProvider<IConnectionInfoParams | null>
  ) {
    const connection = context.getContext(this.connectionsManagerService.connectionContext);

    if (!connectionKey) {
      if (!this.connectionsManagerService.hasAnyConnection()) {
        return;
      }
      connectionKey = createConnectionParam(this.connectionsManagerService.projectConnections[0]);
    }

    try {
      const tempConnection = await this.auth(connectionKey);

      if (!tempConnection?.connected) {
        return;
      }
      connection.connection = tempConnection;
    } catch (exception: any) {
      this.notificationService.logException(exception);
      throw exception;
    }
  }

  async auth(key: IConnectionInfoParams): Promise<Connection | null> {
    if (!this.connectionInfoResource.has(key)) {
      return null;
    }

    let connection = this.connectionInfoResource.get(key);

    if (!connection?.connected) {
      connection = await this.connectionInfoResource.refresh(key);
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

    connection = await this.connectionInfoResource.load(key);

    const networkHandlers = connection.networkHandlersConfig
      .filter(handler => handler.enabled && !handler.savePassword)
      .map(handler => handler.id);

    if (connection.authNeeded || networkHandlers.length > 0) {
      await this.commonDialogService.open(DatabaseAuthDialog, {
        connection: key,
        networkHandlers,
      });
    } else {
      await this.connectionInfoResource.init({ projectId: key.projectId, connectionId: key.connectionId });
    }

    return this.connectionInfoResource.get(key)!;
  }
}
