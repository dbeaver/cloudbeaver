/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { ENotificationType, type INotificationOptions } from '@cloudbeaver/core-events';
import {
  type IBaseServerEvent,
  type ISessionEvent,
  type SessionEventId,
  SessionEventSource,
  SessionEventTopic,
  TopicEventHandler,
} from '@cloudbeaver/core-root';
import { CbEventTopic, WsUserNotificationEventType, type WsServerNotificationEvent } from '@cloudbeaver/core-sdk';

const NOTIFICATION_TYPE_MAP = {
  [WsUserNotificationEventType.Info]: ENotificationType.Info,
  [WsUserNotificationEventType.Error]: ENotificationType.Error,
  [WsUserNotificationEventType.Loading]: ENotificationType.Loading,
  [WsUserNotificationEventType.Custom]: ENotificationType.Custom,
};

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

  map(event: WsServerNotificationEvent): ServerNotificationEventMapped {
    return {
      id: event.id,
      topicId: event.topicId,
      options: {
        message: event.message,
        title: event.title ?? '',
      },
      type: NOTIFICATION_TYPE_MAP[event.notificationType] || ENotificationType.Info,
    };
  }
}
