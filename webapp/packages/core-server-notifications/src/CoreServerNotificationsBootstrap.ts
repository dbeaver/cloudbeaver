/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { ServerNotificationsEventHandler } from './ServerNotificationsEventHandler.js';
import { NotificationService } from '@cloudbeaver/core-events';
import { ServerNotificationsHelper } from './ServerNotificationsHelper.js';
import { SessionResource } from '@cloudbeaver/core-root';
import { CbServerEventId } from '@cloudbeaver/core-sdk';

@injectable(() => [ServerNotificationsEventHandler, NotificationService, SessionResource])
export class CoreServerNotificationsBootstrap extends Bootstrap {
  constructor(
    private readonly serverNotificationsEventHandler: ServerNotificationsEventHandler,
    private readonly notificationService: NotificationService,
    private readonly sessionResource: SessionResource,
  ) {
    super();
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
