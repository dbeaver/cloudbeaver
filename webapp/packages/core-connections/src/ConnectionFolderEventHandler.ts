/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { type SessionEvent, SessionEventSource, SessionEventType } from '@cloudbeaver/core-root';
import { CbEvent, CbEventStatus as EConnectionInfoEventType, IEventData, ResourceEventHandler } from '@cloudbeaver/core-sdk';

export { EConnectionInfoEventType };

export interface IConnectionFolderEvent {
  eventType: EConnectionInfoEventType;
  nodePaths: string[];
  projectId: string;
}

@injectable()
export class ConnectionFolderEventHandler extends ResourceEventHandler<IConnectionFolderEvent, SessionEvent> {
  constructor(
    sessionEventSource: SessionEventSource
  ) {
    super([SessionEventType.CbDatasourceFolderUpdated], sessionEventSource);
  }

  map(event: IEventData<CbEvent>): IEventData<IConnectionFolderEvent> {
    const data: IConnectionFolderEvent = event.data.eventData;
    return {
      name: data.eventType,
      data,
    };
  }

  filter(event: IEventData<CbEvent>): boolean {
    return event.name === SessionEventType.CbDatasourceFolderUpdated;
  }
}
