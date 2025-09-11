/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { NotificationService } from './NotificationService.js';
import { ServerNotificationsEventHandler } from './ServerNotificationsEventHandler.js';
import { CbServerEventId } from '@cloudbeaver/core-sdk';
import { SessionResource } from '@cloudbeaver/core-root';
import { ServerNotificationsHelper } from './ServerNotificationsHelper.js';

@injectable(() => [NotificationService, ServerNotificationsEventHandler, SessionResource])
export class ServerNotificationsService extends Bootstrap {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly serverNotificationsEventHandler: ServerNotificationsEventHandler,
    private readonly sessionResource: SessionResource,
  ) {
    super();
    console.log('ServerNotificationsService#constructor');
    this.serverNotificationsEventHandler.onEvent(
      CbServerEventId.CbUserSessionLimit,
      event => {
        this.notificationService.notify(
          ServerNotificationsHelper.mapEventToNotification(event),
          ServerNotificationsHelper.mapNotificationType(event.eventNotificationType),
        );
      },
      undefined,
      this.sessionResource,
    );
  }
}
