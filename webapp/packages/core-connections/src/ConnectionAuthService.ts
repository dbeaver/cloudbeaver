/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { AuthProviderService } from '@cloudbeaver/core-authentication';
import { injectable } from '@cloudbeaver/core-di';
import { CommonDialogService } from '@cloudbeaver/core-dialogs';

import { Connection, ConnectionInfoResource } from './ConnectionInfoResource';
import { DatabaseAuthDialog } from './DatabaseAuthDialog/DatabaseAuthDialog';
import { SSH_TUNNEL_ID } from './NetworkHandlerResource';

@injectable()
export class ConnectionAuthService {
  constructor(
    private connectionInfoResource: ConnectionInfoResource,
    private commonDialogService: CommonDialogService,
    private authProviderService: AuthProviderService
  ) { }

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

    await this.connectionInfoResource.waitLoad();
    connection = this.connectionInfoResource.get(connectionId);

    if (!connection) {
      return null;
    }

    const sshConfig = connection.networkHandlersConfig.find(state => state.id === SSH_TUNNEL_ID);

    const isSSHAuthNeeded = sshConfig?.enabled && !sshConfig?.savePassword;

    if (connection.authNeeded || isSSHAuthNeeded) {
      await this.commonDialogService.open(DatabaseAuthDialog, connectionId);
    } else {
      await this.connectionInfoResource.init({ id: connectionId });
    }

    return this.connectionInfoResource.get(connectionId)!;
  }
}
