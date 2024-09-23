/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { type ISessionEvent, SessionEventSource, SessionEventTopic, TopicEventHandler } from '@cloudbeaver/core-root';
import type { CbDatabaseOutputLogEvent, CbSessionLogEvent as ISessionLogEvent } from '@cloudbeaver/core-sdk';

export { type ISessionLogEvent };

@injectable()
export class OutputLogsEventHandler extends TopicEventHandler<ISessionLogEvent, ISessionEvent> {
  constructor(sessionEventSource: SessionEventSource) {
    super(SessionEventTopic.CbDatabaseOutputLog, sessionEventSource);
  }

  map(event: CbDatabaseOutputLogEvent) {
    return event;
  }
}
