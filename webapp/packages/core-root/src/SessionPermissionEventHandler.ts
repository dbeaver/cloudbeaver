/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import type { CbSubjectPermissionUpdateEvent as ISessionPermissionEvent } from '@cloudbeaver/core-sdk';

import { TopicEventHandler } from './ServerEventEmitter/TopicEventHandler.js';
import { type ISessionEvent, type SessionEventId, SessionEventSource, SessionEventTopic } from './SessionEventSource.js';

export type { ISessionPermissionEvent };

export class SessionPermissionEventHandlerImpl extends TopicEventHandler<ISessionPermissionEvent, ISessionEvent, SessionEventId, SessionEventTopic> {
  constructor(sessionEventSource: SessionEventSource) {
    super(SessionEventTopic.CbSubjectPermissions, sessionEventSource);
  }

  map(event: any): ISessionPermissionEvent {
    return event;
  }
}

export type SessionPermissionEventHandler = SessionPermissionEventHandlerImpl;

export class SessionPermissionEventHandlerDI extends Context.Service<SessionPermissionEventHandlerDI, SessionPermissionEventHandlerImpl>()(
  '@cloudbeaver/core-root/SessionPermissionEventHandler#SessionPermissionEventHandler',
) {
  static readonly implementation = SessionPermissionEventHandlerImpl;

  static readonly dependencies = () => [SessionEventSource] as const;
  static readonly make: Effect.Effect<SessionPermissionEventHandlerImpl, never, Context.Service.Identifier<typeof SessionEventSource>> = Effect.gen(
    function* makeSessionPermissionEventHandler() {
      const sessionEventSource = yield* SessionEventSource;

      return new SessionPermissionEventHandlerImpl(sessionEventSource);
    },
  );
  static readonly layer: Layer.Layer<SessionPermissionEventHandlerDI, never, Context.Service.Identifier<typeof SessionEventSource>> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const SessionPermissionEventHandler = SessionPermissionEventHandlerDI;
