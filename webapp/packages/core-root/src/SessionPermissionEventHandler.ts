/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { ISessionEvent, SessionEventId, SessionEventSource, SessionEventTopic, TopicEventHandler } from '@cloudbeaver/core-root';
import type { CbSubjectPermissionUpdateEvent as ISessionPermissionEvent } from '@cloudbeaver/core-sdk';

export { ISessionPermissionEvent };

@injectable()
export class SessionPermissionEventHandler extends TopicEventHandler<ISessionPermissionEvent, ISessionEvent, SessionEventId, SessionEventTopic> {
  constructor(sessionEventSource: SessionEventSource) {
    super(SessionEventTopic.CbSubjectPermissions, sessionEventSource);
  }

  map(event: any): ISessionPermissionEvent {
    return event;
  }
}
