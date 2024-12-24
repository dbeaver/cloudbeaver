/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import type { WsAsyncTaskInfo } from '@cloudbeaver/core-sdk';

import { TopicEventHandler } from '../ServerEventEmitter/TopicEventHandler.js';
import { type ISessionEvent, type SessionEventId, SessionEventSource, SessionEventTopic } from '../SessionEventSource.js';

@injectable()
export class AsyncTaskInfoEventHandler extends TopicEventHandler<WsAsyncTaskInfo, ISessionEvent, SessionEventId, SessionEventTopic> {
  constructor(sessionEventSource: SessionEventSource) {
    super(SessionEventTopic.CbSessionTask, sessionEventSource);
  }

  map(event: any): WsAsyncTaskInfo {
    return event;
  }
}
