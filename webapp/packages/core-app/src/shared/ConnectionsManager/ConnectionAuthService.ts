/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';

import { ConnectionInfoResource } from './ConnectionInfoResource';
import { ConnectionsManagerService } from './ConnectionsManagerService';

@injectable()
export class ConnectionAuthService {

  constructor(
    private connectionManagerService: ConnectionsManagerService,
    private connectionInfoResource: ConnectionInfoResource
  ) {}

  async auth(connectionId: string) {
    let connection = this.connectionInfoResource.get(connectionId);

    if (!connection?.connected) {
      connection = await this.connectionInfoResource.refresh(connectionId);
    } else {
      return;
    }

    if (connection.connected) {
      return;
    }

    if (connection.authNeeded) {
      const properties = await this.connectionInfoResource.loadAuthModel(connectionId);
      // TODO: authorize dialog
      // init with credentials
      // await this.connectionInfoResource.init(connectionId);
    } else {
      await this.connectionInfoResource.init(connectionId);
    }
  }
}
