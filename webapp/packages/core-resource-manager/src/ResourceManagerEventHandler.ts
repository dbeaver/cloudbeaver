/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { ISessionEvent, SessionEventSource, TopicEventHandler, SessionEventTopic } from '@cloudbeaver/core-root';
import { CbEventStatus as EResourceManagerEventType, CbrmEvent as IResourceManagerEvent } from '@cloudbeaver/core-sdk';

export { EResourceManagerEventType, type IResourceManagerEvent };

@injectable()
export class ResourceManagerEventHandler extends TopicEventHandler<IResourceManagerEvent, ISessionEvent> {
  constructor(
    sessionEventSource: SessionEventSource
  ) {
    super(SessionEventTopic.CbRm, sessionEventSource);
  }

  map(event: any): IResourceManagerEvent {
    return event;
  }
}
