/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { type ISessionEvent, type SessionEventId, SessionEventSource, TopicEventHandler } from '@cloudbeaver/core-root';
import { CbEventTopic, type WsaiChatMessageChunkEvent, type WsaiChatMessageErrorEvent, type WsaiChatMessageEvent } from '@cloudbeaver/core-sdk';

export type IAiChatMessageChunkEvent = WsaiChatMessageChunkEvent;
export type IAiChatMessageErrorEvent = WsaiChatMessageErrorEvent;
export type IAiChatMessageEvent = WsaiChatMessageEvent;

type Event = IAiChatMessageChunkEvent | IAiChatMessageErrorEvent | IAiChatMessageEvent;

@injectable(() => [SessionEventSource])
export class AIChatMessageEventHandler extends TopicEventHandler<Event, ISessionEvent<CbEventTopic>, SessionEventId, string> {
  constructor(sessionEventSource: SessionEventSource) {
    super(CbEventTopic.CbAi, sessionEventSource);
  }

  map(event: any): Event {
    return event;
  }
}
