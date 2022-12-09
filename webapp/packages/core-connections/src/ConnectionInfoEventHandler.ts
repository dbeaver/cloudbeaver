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

export interface IConnectionInfoEvent {
  eventType: EConnectionInfoEventType;
  dataSourceIds: string[];
  projectId: string;
}

@injectable()
export class ConnectionInfoEventHandler extends TopicEventHandler<IConnectionInfoEvent, ISessionEvent> {
  constructor(
    sessionEventSource: SessionEventSource
  ) {
    super(SessionEventType.CbDatasourceUpdated, sessionEventSource);
  }

  map(event: any): IConnectionInfoEvent {
    return event.eventData;
  }
}
