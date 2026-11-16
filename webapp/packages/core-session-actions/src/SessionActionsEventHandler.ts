/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import {
  ClientEventId,
  SessionEventSource,
  SessionEventTopic,
  TopicEventHandler,
  type ISessionEvent,
  type SessionEventId,
} from '@cloudbeaver/core-root';
import { CbEventTopic, type CbActionCancelledEvent, type WsOpenUrlEvent } from '@cloudbeaver/core-sdk';

export class SessionActionsEventHandlerImpl extends TopicEventHandler<WsOpenUrlEvent, ISessionEvent, SessionEventId, SessionEventTopic> {
  constructor(sessionEventSource: SessionEventSource) {
    super(CbEventTopic.CbSessionAction, sessionEventSource);
  }

  cancelAuth(actionId: string): void {
    this.emit<CbActionCancelledEvent>({
      id: ClientEventId.CbClientCancelAction,
      topicId: SessionEventTopic.CbSessionAction,
      actionId,
    });
  }

  map(event: WsOpenUrlEvent): WsOpenUrlEvent {
    return event;
  }
}

export type SessionActionsEventHandler = SessionActionsEventHandlerImpl;

export class SessionActionsEventHandlerDI extends Context.Service<SessionActionsEventHandlerDI, SessionActionsEventHandlerImpl>()(
  '@cloudbeaver/core-session-actions/SessionActionsEventHandler#SessionActionsEventHandler',
) {
  static readonly implementation = SessionActionsEventHandlerImpl;

  static readonly dependencies = () => [SessionEventSource] as const;
  static readonly make: Effect.Effect<SessionActionsEventHandlerImpl, never, Context.Service.Identifier<typeof SessionEventSource>> = Effect.gen(
    function* makeSessionActionsEventHandler() {
      const sessionEventSource = yield* SessionEventSource;

      return new SessionActionsEventHandlerImpl(sessionEventSource);
    },
  );
  static readonly layer: Layer.Layer<SessionActionsEventHandlerDI, never, Context.Service.Identifier<typeof SessionEventSource>> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const SessionActionsEventHandler = SessionActionsEventHandlerDI;
