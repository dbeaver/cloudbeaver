/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { type ISessionEvent, SessionEventSource, SessionEventTopic, TopicEventHandler } from '@cloudbeaver/core-root';
import type { CbSessionLogEvent as ISessionLogEvent } from '@cloudbeaver/core-sdk';

export { type ISessionLogEvent };

export class SessionLogsEventHandlerImpl extends TopicEventHandler<ISessionLogEvent, ISessionEvent> {
  constructor(sessionEventSource: SessionEventSource) {
    super(SessionEventTopic.CbSessionLog, sessionEventSource);
  }

  map(event: any) {
    return event;
  }
}

export type SessionLogsEventHandler = SessionLogsEventHandlerImpl;

export class SessionLogsEventHandlerDI extends Context.Service<SessionLogsEventHandlerDI, SessionLogsEventHandlerImpl>()(
  '@cloudbeaver/plugin-log-viewer/SessionLogsEventHandler#SessionLogsEventHandler',
) {
  static readonly implementation = SessionLogsEventHandlerImpl;

  static readonly dependencies = () => [SessionEventSource] as const;
  static readonly make: Effect.Effect<SessionLogsEventHandlerImpl, never, Context.Service.Identifier<typeof SessionEventSource>> = Effect.gen(
    function* makeSessionLogsEventHandler() {
      const sessionEventSource = yield* SessionEventSource;

      return new SessionLogsEventHandlerImpl(sessionEventSource);
    },
  );
  static readonly layer: Layer.Layer<SessionLogsEventHandlerDI, never, Context.Service.Identifier<typeof SessionEventSource>> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const SessionLogsEventHandler = SessionLogsEventHandlerDI;
