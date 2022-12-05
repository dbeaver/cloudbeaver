/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { type SessionEvent, SessionEventSource, SessionEventType } from '@cloudbeaver/core-root';
import { CbEvent, CbEventStatus as EConnectionInfoEventType, ResourceEventHandler } from '@cloudbeaver/core-sdk';

export { EConnectionInfoEventType };

export interface IConnectionInfoEvent {
  eventType: EConnectionInfoEventType;
  dataSourceIds: string[];
  projectId: string;
}

@injectable()
export class ConnectionInfoEventHandler extends ResourceEventHandler<IConnectionInfoEvent, SessionEvent> {
  constructor(
    sessionEventSource: SessionEventSource
  ) {
    super(sessionEventSource);
  }

  map(event: CbEvent): IConnectionInfoEvent {
    return event.eventData;
  }

  filter(event: CbEvent): boolean {
    return event.eventType === SessionEventType.CbDatasourceUpdated;
  }
}
