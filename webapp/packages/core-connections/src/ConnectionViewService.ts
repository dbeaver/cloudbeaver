/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { NavNodeManagerService, NodeManagerUtils } from '@cloudbeaver/core-app';
import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { GraphQLService, NavigatorSettingsInput } from '@cloudbeaver/core-sdk';

@injectable()
export class ConnectionViewService {
  constructor(
    private graphQLService: GraphQLService,
    private navNodeManagerService: NavNodeManagerService,
    private notificationService: NotificationService
  ) { }

  async changeConnectionView(nodeId: string, settings: NavigatorSettingsInput): Promise<void> {
    const connectionId = NodeManagerUtils.connectionNodeIdToConnectionId(nodeId);

    try {
      await this.graphQLService.sdk.setConnectionNavigatorSettings({
        id: connectionId,
        settings,
      });

      await this.navNodeManagerService.refreshTree(nodeId);
    } catch (exception) {
      this.notificationService.logException(exception);
    }
  }
}
