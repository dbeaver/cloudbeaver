/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { AuthProviderService } from '@cloudbeaver/core-authentication';
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import {
  Connection,
  ConnectionInfoResource,
  ConnectionsManagerService,
  createConnectionParam,
  IConnectionInfoParams,
  IRequireConnectionExecutorData,
} from '@cloudbeaver/core-connections';
import { Dependency, injectable } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';
import { isSharedProject, ProjectInfoResource } from '@cloudbeaver/core-projects';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import { AuthenticationService } from '@cloudbeaver/plugin-authentication';

const DatabaseAuthDialog = importLazyComponent(() => import('./DatabaseAuthDialog/DatabaseAuthDialog').then(m => m.DatabaseAuthDialog));

@injectable()
export class ConnectionAuthService extends Dependency {
  constructor(
    private readonly connectionInfoResource: ConnectionInfoResource,
    private readonly commonDialogService: CommonDialogService,
    private readonly authProviderService: AuthProviderService,
    private readonly connectionsManagerService: ConnectionsManagerService,
    private readonly authenticationService: AuthenticationService,
    private readonly serverConfigResource: ServerConfigResource,
    private readonly projectInfoResource: ProjectInfoResource,
  ) {
    super();

    connectionsManagerService.connectionExecutor.addHandler(this.connectionDialog.bind(this));
    this.authenticationService.onLogout.before(connectionsManagerService.onDisconnect, state => ({
      connections: connectionInfoResource.values.filter(connection => connection.connected).map(createConnectionParam),
      state,
    }));
  }

  isConnectionShared(projectId: string | null): boolean {
    if (projectId === null) {
      return false;
    }

    const project = this.projectInfoResource.get(projectId);

    if (!project) {
      return false;
    }

    return isSharedProject(project);
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

    let connection = await this.connectionInfoResource.load(key);
    const isConnectedInitially = connection?.connected;

    if (connection?.connected) {
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

    connection = await this.connectionInfoResource.load(key, ['includeAuthNeeded', 'includeNetworkHandlersConfig', 'includeCredentialsSaved']);

    const networkHandlers = connection
      .networkHandlersConfig!.filter(handler => handler.enabled && (!handler.savePassword || resetCredentials))
      .map(handler => handler.id);

    if (connection.authNeeded || (connection.credentialsSaved && resetCredentials) || networkHandlers.length > 0) {
      const result = await this.commonDialogService.open(DatabaseAuthDialog, {
        connection: key,
        networkHandlers,
        resetCredentials,
        distributed: this.serverConfigResource.distributed,
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
