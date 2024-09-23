/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { type ISessionEvent, type SessionEventId, SessionEventSource, SessionEventTopic, TopicEventHandler } from '@cloudbeaver/core-root';
import type { CbDatasourceFolderEvent as IConnectionFolderEvent } from '@cloudbeaver/core-sdk';

export type { IConnectionFolderEvent };

@injectable()
export class ConnectionFolderEventHandler extends TopicEventHandler<IConnectionFolderEvent, ISessionEvent, SessionEventId, SessionEventTopic> {
  constructor(sessionEventSource: SessionEventSource) {
    super(SessionEventTopic.CbDatasourceFolder, sessionEventSource);
  }

  map(event: any): IConnectionFolderEvent {
    return event;
  }
}
