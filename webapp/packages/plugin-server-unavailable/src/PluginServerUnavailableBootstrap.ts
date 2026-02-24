/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { ServerHealthCheckService, ServerHealthStatus } from '@cloudbeaver/core-root';

@injectable(() => [ServerHealthCheckService, NotificationService])
export class PluginServerUnavailableBootstrap extends Bootstrap {
  notificationId?: number;

  constructor(
    private readonly serverHealthCheckService: ServerHealthCheckService,
    private readonly notificationService: NotificationService,
  ) {
    super();
    this.notificationId = undefined;
  }

  override register(): void {
    this.serverHealthCheckService.onServerAliveChange.addHandler(this.handleServerAliveChange.bind(this));
    this.notificationService.closeTask.addHandler(this.handleCloseNotification.bind(this));
  }

  private handleCloseNotification(id: number) {
    if (id === this.notificationId) {
      this.notificationId = undefined;
    }
  }

  private handleServerAliveChange(status: ServerHealthStatus) {
    if (status === ServerHealthStatus.Alive) {
      if (this.notificationId) {
        this.notificationService.close(this.notificationId);
        this.notificationId = undefined;
      }
    }

    if (status === ServerHealthStatus.Unavailable) {
      const notification = this.notificationService.logError({
        title: 'plugin_server_unavailable_error_title',
        message: 'plugin_server_unavailable_error_message',
        pinned: true,
      });
      this.notificationId = notification.id;
    }
  }
}
