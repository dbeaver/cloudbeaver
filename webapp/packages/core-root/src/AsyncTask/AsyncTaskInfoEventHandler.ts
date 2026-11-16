/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import type { WsAsyncTaskInfo } from '@cloudbeaver/core-sdk';

import { TopicEventHandler } from '../ServerEventEmitter/TopicEventHandler.js';
import { type ISessionEvent, type SessionEventId, SessionEventSource, SessionEventTopic } from '../SessionEventSource.js';

export class AsyncTaskInfoEventHandlerImpl extends TopicEventHandler<WsAsyncTaskInfo, ISessionEvent, SessionEventId, SessionEventTopic> {
  constructor(sessionEventSource: SessionEventSource) {
    super(SessionEventTopic.CbSessionTask, sessionEventSource);
  }

  map(event: any): WsAsyncTaskInfo {
    return event;
  }
}

export type AsyncTaskInfoEventHandler = AsyncTaskInfoEventHandlerImpl;

export class AsyncTaskInfoEventHandlerDI extends Context.Service<AsyncTaskInfoEventHandlerDI, AsyncTaskInfoEventHandlerImpl>()(
  '@cloudbeaver/core-root/AsyncTask/AsyncTaskInfoEventHandler#AsyncTaskInfoEventHandler',
) {
  static readonly implementation = AsyncTaskInfoEventHandlerImpl;

  static readonly dependencies = () => [SessionEventSource] as const;
  static readonly make: Effect.Effect<AsyncTaskInfoEventHandlerImpl, never, Context.Service.Identifier<typeof SessionEventSource>> = Effect.gen(
    function* makeAsyncTaskInfoEventHandler() {
      const sessionEventSource = yield* SessionEventSource;

      return new AsyncTaskInfoEventHandlerImpl(sessionEventSource);
    },
  );
  static readonly layer: Layer.Layer<AsyncTaskInfoEventHandlerDI, never, Context.Service.Identifier<typeof SessionEventSource>> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const AsyncTaskInfoEventHandler = AsyncTaskInfoEventHandlerDI;
