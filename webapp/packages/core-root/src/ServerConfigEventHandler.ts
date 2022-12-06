/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import {
  CbEvent,
  IEventData,
  ResourceEventHandler
} from '@cloudbeaver/core-sdk';

import { SessionEvent, SessionEventSource, SessionEventType } from './SessionEventSource';

@injectable()
export class ServerConfigEventHandler extends ResourceEventHandler<null, SessionEvent> {
  constructor(
    sessionEventSource: SessionEventSource
  ) {
    super([SessionEventType.CbConfigChanged], sessionEventSource);
  }

  map(event: IEventData<CbEvent>): IEventData<null> {
    return { ...event, data: null };
  }

  filter(event: IEventData<CbEvent>): boolean {
    return event.name === SessionEventType.CbConfigChanged;
  }
}
