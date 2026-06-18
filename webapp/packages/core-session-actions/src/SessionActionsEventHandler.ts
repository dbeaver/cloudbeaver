/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import {
  ClientEventId,
  type ISessionEvent,
  type SessionEventId,
  SessionEventSource,
  SessionEventTopic,
  TopicEventHandler,
} from '@cloudbeaver/core-root';
import { CbEventTopic, type CbActionCancelledEvent, type WsOpenUrlEvent } from '@cloudbeaver/core-sdk';

@injectable(() => [SessionEventSource])
export class SessionActionsEventHandler extends TopicEventHandler<WsOpenUrlEvent, ISessionEvent, SessionEventId, SessionEventTopic> {
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
