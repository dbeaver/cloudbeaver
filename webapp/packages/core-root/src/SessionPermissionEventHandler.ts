/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import type { CbSubjectPermissionUpdateEvent as ISessionPermissionEvent } from '@cloudbeaver/core-sdk';

import { TopicEventHandler } from './ServerEventEmitter/TopicEventHandler.js';
import { type ISessionEvent, type SessionEventId, SessionEventSource, SessionEventTopic } from './SessionEventSource.js';

export type { ISessionPermissionEvent };

@injectable()
export class SessionPermissionEventHandler extends TopicEventHandler<ISessionPermissionEvent, ISessionEvent, SessionEventId, SessionEventTopic> {
  constructor(sessionEventSource: SessionEventSource) {
    super(SessionEventTopic.CbSubjectPermissions, sessionEventSource);
  }

  map(event: any): ISessionPermissionEvent {
    return event;
  }
}
