/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { type ISessionEvent, type SessionEventId, SessionEventSource, SessionEventTopic, TopicEventHandler } from '@cloudbeaver/core-root';
import type { CbDatasourceEvent as IConnectionInfoEvent } from '@cloudbeaver/core-sdk';

export type { IConnectionInfoEvent };

export class ConnectionInfoEventHandlerImpl extends TopicEventHandler<IConnectionInfoEvent, ISessionEvent, SessionEventId, SessionEventTopic> {
  constructor(sessionEventSource: SessionEventSource) {
    super(SessionEventTopic.CbDatasource, sessionEventSource);
  }

  map(event: any): IConnectionInfoEvent {
    return event;
  }
}

export type ConnectionInfoEventHandler = ConnectionInfoEventHandlerImpl;

export class ConnectionInfoEventHandlerDI extends Context.Service<ConnectionInfoEventHandlerDI, ConnectionInfoEventHandlerImpl>()(
  '@cloudbeaver/core-connections/ConnectionInfoEventHandler#ConnectionInfoEventHandler',
) {
  static readonly implementation = ConnectionInfoEventHandlerImpl;

  static readonly dependencies = () => [SessionEventSource] as const;
  static readonly make: Effect.Effect<ConnectionInfoEventHandlerImpl, never, Context.Service.Identifier<typeof SessionEventSource>> = Effect.gen(
    function* makeConnectionInfoEventHandler() {
      const sessionEventSource = yield* SessionEventSource;

      return new ConnectionInfoEventHandlerImpl(sessionEventSource);
    },
  );
  static readonly layer: Layer.Layer<ConnectionInfoEventHandlerDI, never, Context.Service.Identifier<typeof SessionEventSource>> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const ConnectionInfoEventHandler = ConnectionInfoEventHandlerDI;
