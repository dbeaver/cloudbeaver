/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { type ISessionEvent, type SessionEventId, SessionEventSource, TopicEventHandler } from '@cloudbeaver/core-root';
import { CbEventTopic, type WsaiChatMessageChunkEvent, type WsaiChatMessageErrorEvent, type WsaiChatMessageEvent } from '@cloudbeaver/core-sdk';

export type IAiChatMessageChunkEvent = WsaiChatMessageChunkEvent;
export type IAiChatMessageErrorEvent = WsaiChatMessageErrorEvent;
export type IAiChatMessageEvent = WsaiChatMessageEvent;

type Event = IAiChatMessageChunkEvent | IAiChatMessageErrorEvent | IAiChatMessageEvent;

export class AIChatMessageEventHandlerImpl extends TopicEventHandler<Event, ISessionEvent<CbEventTopic>, SessionEventId, string> {
  constructor(sessionEventSource: SessionEventSource) {
    super(CbEventTopic.CbAi, sessionEventSource);
  }

  map(event: any): Event {
    return event;
  }
}

export type AIChatMessageEventHandler = AIChatMessageEventHandlerImpl;

export class AIChatMessageEventHandlerDI extends Context.Service<AIChatMessageEventHandlerDI, AIChatMessageEventHandlerImpl>()(
  '@cloudbeaver/plugin-ai-chat/AIChat/AIChatMessage/AIChatMessageEventHandler#AIChatMessageEventHandler',
) {
  static readonly implementation = AIChatMessageEventHandlerImpl;

  static readonly dependencies = () => [SessionEventSource] as const;
  static readonly make: Effect.Effect<AIChatMessageEventHandlerImpl, never, Context.Service.Identifier<typeof SessionEventSource>> = Effect.gen(
    function* makeAIChatMessageEventHandler() {
      const sessionEventSource = yield* SessionEventSource;

      return new AIChatMessageEventHandlerImpl(sessionEventSource);
    },
  );
  static readonly layer: Layer.Layer<AIChatMessageEventHandlerDI, never, Context.Service.Identifier<typeof SessionEventSource>> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const AIChatMessageEventHandler = AIChatMessageEventHandlerDI;
