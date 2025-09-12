/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import type { ENotificationType, INotificationOptions } from '@cloudbeaver/core-events';
import {
  type IBaseServerEvent,
  type ISessionEvent,
  type SessionEventId,
  SessionEventSource,
  SessionEventTopic,
  TopicEventHandler,
} from '@cloudbeaver/core-root';
import { CbEventTopic, type WsUserNotificationEvent } from '@cloudbeaver/core-sdk';
import { ServerNotificationsHelper } from './ServerNotificationsHelper.js';

interface ServerNotificationEventMapped extends IBaseServerEvent<SessionEventId, SessionEventTopic> {
  options: INotificationOptions;
  type: ENotificationType;
}

@injectable(() => [SessionEventSource])
export class ServerNotificationsEventHandler extends TopicEventHandler<
  ServerNotificationEventMapped,
  ISessionEvent,
  SessionEventId,
  SessionEventTopic
> {
  constructor(sessionEventSource: SessionEventSource) {
    super(CbEventTopic.CbNotification, sessionEventSource);
  }

  map(event: WsUserNotificationEvent): ServerNotificationEventMapped {
    return {
      id: event.id,
      topicId: event.topicId,
      options: ServerNotificationsHelper.mapEventToNotification(event),
      type: ServerNotificationsHelper.mapNotificationType(event.eventNotificationType),
    };
  }
}
