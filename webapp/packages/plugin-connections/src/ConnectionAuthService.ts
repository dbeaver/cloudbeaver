/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { AuthProviderService, UserInfoResource } from '@cloudbeaver/core-authentication';
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import {
  type Connection,
  ConnectionInfoAuthPropertiesResource,
  ConnectionInfoExternalNetworkHandlersService,
  type ConnectionInfoNetworkHandlers,
  ConnectionInfoNetworkHandlersResource,
  ConnectionInfoResource,
  ConnectionsManagerService,
  createConnectionParam,
  type IConnectionInfoParams,
  type IRequireConnectionExecutorData,
} from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';
import { AuthenticationService } from '@cloudbeaver/plugin-authentication';

const DatabaseAuthDialog = importLazyComponent(() => import('./DatabaseAuthDialog/DatabaseAuthDialog.js').then(m => m.DatabaseAuthDialog));

@injectable(() => [
  ConnectionInfoResource,
  ConnectionInfoNetworkHandlersResource,
  ConnectionInfoAuthPropertiesResource,
  ConnectionInfoExternalNetworkHandlersService,
  CommonDialogService,
  AuthProviderService,
  UserInfoResource,
  ConnectionsManagerService,
  AuthenticationService,
])
export class ConnectionAuthService {
  constructor(
    private readonly connectionInfoResource: ConnectionInfoResource,
    private readonly connectionInfoNetworkHandlersResource: ConnectionInfoNetworkHandlersResource,
    private readonly connectionInfoAuthPropertiesResource: ConnectionInfoAuthPropertiesResource,
    private readonly connectionInfoExternalNetworkHandlersService: ConnectionInfoExternalNetworkHandlersService,
    private readonly commonDialogService: CommonDialogService,
    private readonly authProviderService: AuthProviderService,
    userInfoResource: UserInfoResource,
    private readonly connectionsManagerService: ConnectionsManagerService,
    private readonly authenticationService: AuthenticationService,
  ) {
    connectionsManagerService.connectionExecutor.addHandler(this.connectionDialog.bind(this));
    this.authenticationService.onLogin.before(
      connectionsManagerService.onDisconnect,
      state => ({
        connections: connectionInfoResource.values.filter(connection => connection.connected).map(createConnectionParam),
        state,
      }),
      state => state === 'before' && userInfoResource.isAnonymous(),
    );
    this.authenticationService.onLogout.before(
      connectionsManagerService.onDisconnect,
      state => ({
        connections: connectionInfoResource.values.filter(connection => connection.connected).map(createConnectionParam),
        state,
      }),
      state => state === 'before',
    );
  }

  private async connectionDialog(data: IRequireConnectionExecutorData, context: IExecutionContextProvider<IRequireConnectionExecutorData | null>) {
    const connection = context.getContext(this.connectionsManagerService.connectionContext);

    const newConnection = await this.auth(data.key, data.resetCredentials);

    if (!newConnection?.connected) {
      return;
    }
    connection.connection = newConnection;
  }

  private async auth(key: IConnectionInfoParams, resetCredentials?: boolean): Promise<Connection | null> {
    if (!this.connectionInfoResource.has(key)) {
      return null;
    }

    let connectionNetworkHandlers: ConnectionInfoNetworkHandlers | null = null;
    let connection = await this.connectionInfoResource.load(key);
    const isConnectedInitially = connection?.connected;

    if (connection?.connected) {
      if (resetCredentials) {
        this.connectionInfoResource.close(key);
      } else {
        return connection;
      }
    }

    const connectionAuthProperties = await this.connectionInfoAuthPropertiesResource.load(key);

    if (connectionAuthProperties.requiredAuth) {
      const state = await this.authProviderService.requireProvider(connectionAuthProperties.requiredAuth);

      if (!state) {
        return connection;
      }
    }

    [connectionNetworkHandlers, connection] = await Promise.all([
      this.connectionInfoNetworkHandlersResource.load(key),
      this.connectionInfoResource.load(key),
    ]);

    const externalHandlers = new Set(await this.connectionInfoExternalNetworkHandlersService.getProvidedHandlers(key));
    const networkHandlers = connectionNetworkHandlers
      .networkHandlersConfig!.filter(handler => !externalHandlers.has(handler.id) && handler.enabled && (!handler.savePassword || resetCredentials))
      .map(handler => handler.id);

    if (connectionAuthProperties.authNeeded || (connectionAuthProperties.credentialsSaved && resetCredentials) || networkHandlers.length > 0) {
      const { status } = await this.commonDialogService.open(DatabaseAuthDialog, {
        connection: key,
        networkHandlers,
        resetCredentials,
      });

      if (resetCredentials && isConnectedInitially && status === DialogueStateResult.Rejected) {
        await this.connectionInfoResource.init(key);
      }
    } else {
      await this.connectionInfoResource.init({ projectId: key.projectId, connectionId: key.connectionId });
    }

    return this.connectionInfoResource.get(key)!;
  }
}
