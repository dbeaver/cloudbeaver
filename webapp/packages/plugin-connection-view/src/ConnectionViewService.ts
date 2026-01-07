/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ConnectionInfoResource, createConnectionParam, type Connection } from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { NavNodeManagerService } from '@cloudbeaver/core-navigation-tree';
import { type NavigatorViewSettings } from '@cloudbeaver/core-root';

@injectable(() => [ConnectionInfoResource, NavNodeManagerService, NotificationService])
export class ConnectionViewService {
  constructor(
    private readonly connectionInfoResource: ConnectionInfoResource,
    private readonly navNodeManagerService: NavNodeManagerService,
    private readonly notificationService: NotificationService,
  ) {}

  async changeConnectionView(connection: Connection, settings: NavigatorViewSettings): Promise<void> {
    try {
      connection = await this.connectionInfoResource.changeConnectionView(createConnectionParam(connection), settings);

      if (connection.nodePath && connection.connected) {
        await this.navNodeManagerService.refreshNode(connection.nodePath);
      }
    } catch (exception: any) {
      this.notificationService.logException(exception);
    }
  }
}
