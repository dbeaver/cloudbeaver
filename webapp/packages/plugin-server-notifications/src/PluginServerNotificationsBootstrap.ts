/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { NotificationEventHandler } from './NotificationEventHandler.js';
import { ServerEventId } from '@cloudbeaver/core-root';
import { ENotificationType, NotificationService } from '@cloudbeaver/core-events';

@injectable(() => [NotificationEventHandler, NotificationService])
export class PluginServerNotificationsBootstrap extends Bootstrap {
  constructor(
    private readonly NotificationEventHandler: NotificationEventHandler,
    private readonly notificationService: NotificationService,
  ) {
    super();

    // TODO add mapper from event notification type to frontend notification type
    this.NotificationEventHandler.onEvent(ServerEventId.CbUserSessionLimit, data => {
      this.notificationService.notify(
        {
          title: '123',
        },
        ENotificationType.Custom,
      );
    });
  }

  override register() {
    console.log('plugin server notifications is registered');
  }
}
