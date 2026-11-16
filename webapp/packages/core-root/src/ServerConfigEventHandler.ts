/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import type { CbConfigEvent as IServerConfigEvent } from '@cloudbeaver/core-sdk';

import { TopicEventHandler } from './ServerEventEmitter/TopicEventHandler.js';
import { type ISessionEvent, SessionEventSource, SessionEventTopic } from './SessionEventSource.js';

export { type IServerConfigEvent };

export class ServerConfigEventHandlerImpl extends TopicEventHandler<IServerConfigEvent, ISessionEvent> {
  constructor(sessionEventSource: SessionEventSource) {
    super(SessionEventTopic.CbConfig, sessionEventSource);
  }

  map(event: any) {
    return event;
  }
}

export type ServerConfigEventHandler = ServerConfigEventHandlerImpl;

export class ServerConfigEventHandlerDI extends Context.Service<ServerConfigEventHandlerDI, ServerConfigEventHandlerImpl>()(
  '@cloudbeaver/core-root/ServerConfigEventHandler#ServerConfigEventHandler',
) {
  static readonly implementation = ServerConfigEventHandlerImpl;

  static readonly dependencies = () => [SessionEventSource] as const;
  static readonly make: Effect.Effect<ServerConfigEventHandlerImpl, never, Context.Service.Identifier<typeof SessionEventSource>> = Effect.gen(
    function* makeServerConfigEventHandler() {
      const sessionEventSource = yield* SessionEventSource;

      return new ServerConfigEventHandlerImpl(sessionEventSource);
    },
  );
  static readonly layer: Layer.Layer<ServerConfigEventHandlerDI, never, Context.Service.Identifier<typeof SessionEventSource>> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const ServerConfigEventHandler = ServerConfigEventHandlerDI;
