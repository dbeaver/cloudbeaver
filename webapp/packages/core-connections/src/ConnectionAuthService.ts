/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { CommonDialogService } from '@cloudbeaver/core-dialogs';

import { ConnectionInfoResource } from './ConnectionInfoResource';
import { DatabaseAuthDialog } from './DatabaseAuthDialog/DatabaseAuthDialog';

@injectable()
export class ConnectionAuthService {

  constructor(
    private connectionInfoResource: ConnectionInfoResource,
    private commonDialogService: CommonDialogService,
  ) {}

  async auth(connectionId: string) {
    let connection = this.connectionInfoResource.get(connectionId);

    if (!connection?.connected) {
      connection = await this.connectionInfoResource.refresh(connectionId);
    } else {
      return connection;
    }

    if (connection.connected) {
      return connection;
    }

    if (connection.authNeeded) {
      await this.commonDialogService.open(DatabaseAuthDialog, connectionId);
    } else {
      await this.connectionInfoResource.init(connectionId);
    }

    return this.connectionInfoResource.get(connectionId)!;
  }
}
