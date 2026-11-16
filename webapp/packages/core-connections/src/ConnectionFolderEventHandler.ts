/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { type ISessionEvent, type SessionEventId, SessionEventSource, SessionEventTopic, TopicEventHandler } from '@cloudbeaver/core-root';
import type { CbDatasourceFolderEvent as IConnectionFolderEvent } from '@cloudbeaver/core-sdk';

export type { IConnectionFolderEvent };

export class ConnectionFolderEventHandlerImpl extends TopicEventHandler<IConnectionFolderEvent, ISessionEvent, SessionEventId, SessionEventTopic> {
  constructor(sessionEventSource: SessionEventSource) {
    super(SessionEventTopic.CbDatasourceFolder, sessionEventSource);
  }

  map(event: any): IConnectionFolderEvent {
    return event;
  }
}

export type ConnectionFolderEventHandler = ConnectionFolderEventHandlerImpl;

export class ConnectionFolderEventHandlerDI extends Context.Service<ConnectionFolderEventHandlerDI, ConnectionFolderEventHandlerImpl>()(
  '@cloudbeaver/core-connections/ConnectionFolderEventHandler#ConnectionFolderEventHandler',
) {
  static readonly implementation = ConnectionFolderEventHandlerImpl;

  static readonly dependencies = () => [SessionEventSource] as const;
  static readonly make: Effect.Effect<ConnectionFolderEventHandlerImpl, never, Context.Service.Identifier<typeof SessionEventSource>> = Effect.gen(
    function* makeConnectionFolderEventHandler() {
      const sessionEventSource = yield* SessionEventSource;

      return new ConnectionFolderEventHandlerImpl(sessionEventSource);
    },
  );
  static readonly layer: Layer.Layer<ConnectionFolderEventHandlerDI, never, Context.Service.Identifier<typeof SessionEventSource>> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const ConnectionFolderEventHandler = ConnectionFolderEventHandlerDI;
