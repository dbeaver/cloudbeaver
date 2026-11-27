/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { ProcessSnackbar } from '@cloudbeaver/core-blocks';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { type INotification, NotificationService } from '@cloudbeaver/core-events';

import { ConnectionInfoResource } from '../ConnectionInfoResource.js';
import { ConnectionExecutionContextResource } from './ConnectionExecutionContextResource.js';

@injectable(() => [ConnectionExecutionContextResource, ConnectionInfoResource, NotificationService])
export class ConnectionExecutionContextNotificationService extends Bootstrap {
  private readonly notifications: Map<string, INotification>;

  constructor(
    private readonly connectionExecutionContextResource: ConnectionExecutionContextResource,
    private readonly connectionInfoResource: ConnectionInfoResource,
    private readonly notificationService: NotificationService,
  ) {
    super();
    this.notifications = new Map();
  }

  override register(): void {
    this.connectionExecutionContextResource.onDestroy.addHandler(({ contextId, stage }) => {
      if (stage === 'before') {
        // A tab keeps its notification until the entire tab close operation finishes.
        const existing = this.notificationService.notificationList.values.find(
          notification => notification.uuid === `execution-context-closing-${contextId}`,
        );

        if (!existing) {
          this.notifications.set(contextId, this.notifyClosing(contextId));
        }
      } else {
        this.notifications.get(contextId)?.close();
        this.notifications.delete(contextId);
      }
    });
  }

  notifyClosing(contextId: string, name?: string): INotification {
    const context = this.connectionExecutionContextResource.get(contextId);
    const connection = context && this.connectionInfoResource.get({ projectId: context.projectId, connectionId: context.connectionId });

    return this.notificationService.processNotification(
      () => ProcessSnackbar,
      {},
      {
        uuid: `execution-context-closing-${contextId}`,
        title: 'core_connections_execution_context_closing',
        message: name ?? connection?.name,
      },
    ).notification;
  }
}
