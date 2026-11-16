/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { ENotificationType, type INotificationOptions } from '@cloudbeaver/core-events';
import {
  SessionEventSource,
  SessionEventTopic,
  TopicEventHandler,
  type IBaseServerEvent,
  type ISessionEvent,
  type SessionEventId,
} from '@cloudbeaver/core-root';
import { CbEventTopic, WsServerNotificationEventType, type WsServerNotificationEvent } from '@cloudbeaver/core-sdk';

const NOTIFICATION_TYPE_MAP = {
  [WsServerNotificationEventType.Info]: ENotificationType.Info,
  [WsServerNotificationEventType.Error]: ENotificationType.Error,
  [WsServerNotificationEventType.Loading]: ENotificationType.Loading,
  [WsServerNotificationEventType.Custom]: ENotificationType.Custom,
};

interface ServerNotificationEventMapped extends IBaseServerEvent<SessionEventId, SessionEventTopic> {
  options: INotificationOptions;
  type: ENotificationType;
}

export class ServerNotificationsEventHandlerImpl extends TopicEventHandler<
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

export type ServerNotificationsEventHandler = ServerNotificationsEventHandlerImpl;

export class ServerNotificationsEventHandlerDI extends Context.Service<ServerNotificationsEventHandlerDI, ServerNotificationsEventHandlerImpl>()(
  '@cloudbeaver/core-server-notifications/ServerNotificationsEventHandler#ServerNotificationsEventHandler',
) {
  static readonly implementation = ServerNotificationsEventHandlerImpl;

  static readonly dependencies = () => [SessionEventSource] as const;
  static readonly make: Effect.Effect<ServerNotificationsEventHandlerImpl, never, Context.Service.Identifier<typeof SessionEventSource>> = Effect.gen(
    function* makeServerNotificationsEventHandler() {
      const sessionEventSource = yield* SessionEventSource;

      return new ServerNotificationsEventHandlerImpl(sessionEventSource);
    },
  );
  static readonly layer: Layer.Layer<ServerNotificationsEventHandlerDI, never, Context.Service.Identifier<typeof SessionEventSource>> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const ServerNotificationsEventHandler = ServerNotificationsEventHandlerDI;
