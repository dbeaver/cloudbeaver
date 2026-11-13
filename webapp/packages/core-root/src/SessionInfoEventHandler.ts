/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { type CbClientEvent, type WsSessionStateEvent as ISessionStateEvent } from '@cloudbeaver/core-sdk';

import { TopicEventHandler } from './ServerEventEmitter/TopicEventHandler.js';
import { ClientEventId, type ISessionEvent, type SessionEventId, SessionEventSource, SessionEventTopic } from './SessionEventSource.js';

export { type ISessionStateEvent };

export class SessionInfoEventHandlerImpl extends TopicEventHandler<ISessionStateEvent, ISessionEvent, SessionEventId, SessionEventTopic> {
  constructor(sessionEventSource: SessionEventSource) {
    super(SessionEventTopic.CbSession, sessionEventSource);
  }

  pingSession(): void {
    this.emit<CbClientEvent>({ id: ClientEventId.CbClientSessionPing });
  }

  map(event: any): ISessionStateEvent {
    return event;
  }
}

export type SessionInfoEventHandler = SessionInfoEventHandlerImpl;

export class SessionInfoEventHandlerDI extends Context.Service<SessionInfoEventHandlerDI, SessionInfoEventHandlerImpl>()(
  '@cloudbeaver/core-root/SessionInfoEventHandler#SessionInfoEventHandler',
) {
  static readonly implementation = SessionInfoEventHandlerImpl;

  static readonly dependencies = () => [SessionEventSource] as const;
  static readonly make: Effect.Effect<SessionInfoEventHandlerImpl, never, Context.Service.Identifier<typeof SessionEventSource>> = Effect.gen(
    function* makeSessionInfoEventHandler() {
      const sessionEventSource = yield* SessionEventSource;

      return new SessionInfoEventHandlerImpl(sessionEventSource);
    },
  );
  static readonly layer: Layer.Layer<SessionInfoEventHandlerDI, never, Context.Service.Identifier<typeof SessionEventSource>> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const SessionInfoEventHandler = SessionInfoEventHandlerDI;
