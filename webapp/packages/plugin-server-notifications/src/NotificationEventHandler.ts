/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { type ISessionEvent, type SessionEventId, SessionEventSource, SessionEventTopic, TopicEventHandler } from '@cloudbeaver/core-root';
import { CbEventTopic, type CbServerEvent } from '@cloudbeaver/core-sdk';

@injectable(() => [SessionEventSource])
export class NotificationEventHandler extends TopicEventHandler<CbServerEvent, ISessionEvent, SessionEventId, SessionEventTopic> {
  constructor(sessionEventSource: SessionEventSource) {
    super(CbEventTopic.CbNotification, sessionEventSource);
  }

  map(event: any) {
    return event;
  }
}
