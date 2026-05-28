/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ConnectionInfoResource, type IConnectionInfoParams } from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import { NavNodeManagerService } from '@cloudbeaver/core-navigation-tree';
import { type NavigatorViewSettings } from '@cloudbeaver/core-root';

import { ConnectionViewResource } from './ConnectionViewResource.js';

@injectable(() => [ConnectionInfoResource, NavNodeManagerService, ConnectionViewResource])
export class ConnectionViewService {
  constructor(
    private readonly connectionInfoResource: ConnectionInfoResource,
    private readonly navNodeManagerService: NavNodeManagerService,
    private readonly connectionViewResource: ConnectionViewResource,
  ) {}

  async changeConnectionView(connectionKey: IConnectionInfoParams, settings: NavigatorViewSettings): Promise<void> {
    const view = await this.connectionViewResource.changeConnectionView(connectionKey, settings);

    if (settings.userSettings === false && view.navigatorSettings.userSettings) {
      return;
    }

    await this.syncNode(connectionKey);
  }

  async clearConnectionView(connectionKey: IConnectionInfoParams): Promise<void> {
    await this.connectionViewResource.clearConnectionView(connectionKey);
    await this.syncNode(connectionKey);
  }

  private async syncNode(connectionKey: IConnectionInfoParams) {
    const connection = await this.connectionInfoResource.load(connectionKey);

    if (connection.nodePath && connection.connected) {
      await this.navNodeManagerService.refreshNode(connection.nodePath);
    }
  }
}
