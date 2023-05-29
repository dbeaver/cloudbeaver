/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import type { WsSessionStateEvent as ISessionStateEvent } from '@cloudbeaver/core-sdk';

import { TopicEventHandler } from './ServerEventEmitter/TopicEventHandler';
import { ISessionEvent, SessionEventId, SessionEventSource, SessionEventTopic } from './SessionEventSource';

export { type ISessionStateEvent };

@injectable()
export class SessionInfoEventHandler extends TopicEventHandler<ISessionStateEvent, ISessionEvent, SessionEventId, SessionEventTopic> {
  constructor(sessionEventSource: SessionEventSource) {
    super(SessionEventTopic.CbSession, sessionEventSource);
  }

  map(event: any): ISessionStateEvent {
    return event;
  }
}
