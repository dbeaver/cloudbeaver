/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { ISessionEvent, SessionEventSource, SessionEventType, TopicEventHandler } from '@cloudbeaver/core-root';
import { CbEventStatus as EConnectionInfoEventType } from '@cloudbeaver/core-sdk';

export { EConnectionInfoEventType };

export interface IConnectionFolderEvent {
  eventType: EConnectionInfoEventType;
  nodePaths: string[];
  projectId: string;
}

@injectable()
export class ConnectionFolderEventHandler
  extends TopicEventHandler<IConnectionFolderEvent, ISessionEvent> {
  constructor(
    sessionEventSource: SessionEventSource
  ) {
    super(SessionEventType.CbDatasourceFolderUpdated, sessionEventSource);
  }

  map(event: any): IConnectionFolderEvent {
    return event.eventData;
  }
}
