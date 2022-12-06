/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { type SessionEvent, SessionEventSource, SessionEventType } from '@cloudbeaver/core-root';
import { CbEvent, CbEventStatus as EResourceManagerEventType, IEventData, ResourceEventHandler } from '@cloudbeaver/core-sdk';

export { EResourceManagerEventType };

export interface IConnectionInfoEvent {
  eventType: EResourceManagerEventType;
  resourcePath: string;
  projectId: string;
}

@injectable()
export class ResourceManagerEventHandler extends ResourceEventHandler<IConnectionInfoEvent, SessionEvent> {
  constructor(
    sessionEventSource: SessionEventSource
  ) {
    super([SessionEventType.CbRmResourceUpdated], sessionEventSource);
  }

  map(event: IEventData<CbEvent>): IEventData<IConnectionInfoEvent> {
    const data: IConnectionInfoEvent = event.data.eventData;
    return {
      name: data.eventType,
      data,
    };
  }

  filter(event: IEventData<CbEvent>): boolean {
    return event.name === SessionEventType.CbRmResourceUpdated;
  }
}
