/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import React from 'react';

import { AuthProviderService } from '@cloudbeaver/core-authentication';
import {
  Connection,
  ConnectionInfoResource,
  ConnectionsManagerService,
  createConnectionParam,
  IConnectionInfoParams,
} from '@cloudbeaver/core-connections';
import { Dependency, injectable } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';
import { AuthenticationService } from '@cloudbeaver/plugin-authentication';

const DatabaseAuthDialog = React.lazy(async () => {
  const { DatabaseAuthDialog } = await import('./DatabaseAuthDialog/DatabaseAuthDialog');
  return { default: DatabaseAuthDialog };
});

@injectable()
export class ConnectionAuthService extends Dependency {
  constructor(
    private readonly connectionInfoResource: ConnectionInfoResource,
    private readonly commonDialogService: CommonDialogService,
    private readonly authProviderService: AuthProviderService,
    private readonly connectionsManagerService: ConnectionsManagerService,
    private readonly authenticationService: AuthenticationService,
  ) {
    super();

    connectionsManagerService.connectionExecutor.addHandler(this.connectionDialog.bind(this));
    this.authenticationService.onLogout.before(connectionsManagerService.onDisconnect, state => ({
      connections: connectionInfoResource.values.filter(connection => connection.connected).map(createConnectionParam),
      state,
    }));
  }

  private async connectionDialog(connectionKey: IConnectionInfoParams, context: IExecutionContextProvider<IConnectionInfoParams | null>) {
    const connection = context.getContext(this.connectionsManagerService.connectionContext);

    const newConnection = await this.auth(connectionKey);

    if (!newConnection?.connected) {
      return;
    }
    connection.connection = newConnection;
  }

  async auth(key: IConnectionInfoParams, resetCredentials?: boolean): Promise<Connection | null> {
    if (!this.connectionInfoResource.has(key)) {
      return null;
    }

    let connection = this.connectionInfoResource.get(key);
    const isConnectedInitially = connection?.connected;

    if (!connection?.connected) {
      connection = await this.connectionInfoResource.refresh(key);
    } else {
      if (resetCredentials) {
        this.connectionInfoResource.close(key);
      } else {
        return connection;
      }
    }

    if (connection.requiredAuth) {
      const state = await this.authProviderService.requireProvider(connection.requiredAuth);

      if (!state) {
        return connection;
      }
    }

    connection = await this.connectionInfoResource.load(key, [
      'includeAuthNeeded',
      'includeNetworkHandlersConfig',
      'includeCredentialsSaved',
      'customIncludeOptions',
      'includeAuthProperties',
      'includeProviderProperties',
    ]);

    const networkHandlers = connection
      .networkHandlersConfig!.filter(handler => handler.enabled && (!handler.savePassword || resetCredentials))
      .map(handler => handler.id);

    if (connection.authNeeded || (connection.credentialsSaved && resetCredentials) || networkHandlers.length > 0) {
      const result = await this.commonDialogService.open(DatabaseAuthDialog, {
        connection: key,
        networkHandlers,
        resetCredentials,
      });

      if (resetCredentials && isConnectedInitially && result === DialogueStateResult.Rejected) {
        await this.connectionInfoResource.init(key);
      }
    } else {
      await this.connectionInfoResource.init({ projectId: key.projectId, connectionId: key.connectionId });
    }

    return this.connectionInfoResource.get(key)!;
  }
}
