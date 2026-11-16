/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { type ISessionEvent, type SessionEventId, SessionEventSource, SessionEventTopic, TopicEventHandler } from '@cloudbeaver/core-root';
import type { WsDataSourceConnectEvent, WsDataSourceDisconnectEvent } from '@cloudbeaver/core-sdk';

export type IWsDataSourceDisconnectEvent = WsDataSourceDisconnectEvent;
export type IWsDataSourceConnectEvent = WsDataSourceConnectEvent;

type ConnectionStateEvent = IWsDataSourceConnectEvent | IWsDataSourceDisconnectEvent;

export class ConnectionStateEventHandlerImpl extends TopicEventHandler<ConnectionStateEvent, ISessionEvent, SessionEventId, SessionEventTopic> {
  constructor(sessionEventSource: SessionEventSource) {
    super(SessionEventTopic.CbDatasourceConnection, sessionEventSource);
  }

  map(event: any): ConnectionStateEvent {
    return event;
  }
}

export type ConnectionStateEventHandler = ConnectionStateEventHandlerImpl;

export class ConnectionStateEventHandlerDI extends Context.Service<ConnectionStateEventHandlerDI, ConnectionStateEventHandlerImpl>()(
  '@cloudbeaver/core-connections/ConnectionStateEventHandler#ConnectionStateEventHandler',
) {
  static readonly implementation = ConnectionStateEventHandlerImpl;

  static readonly dependencies = () => [SessionEventSource] as const;
  static readonly make: Effect.Effect<ConnectionStateEventHandlerImpl, never, Context.Service.Identifier<typeof SessionEventSource>> = Effect.gen(
    function* makeConnectionStateEventHandler() {
      const sessionEventSource = yield* SessionEventSource;

      return new ConnectionStateEventHandlerImpl(sessionEventSource);
    },
  );
  static readonly layer: Layer.Layer<ConnectionStateEventHandlerDI, never, Context.Service.Identifier<typeof SessionEventSource>> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const ConnectionStateEventHandler = ConnectionStateEventHandlerDI;
