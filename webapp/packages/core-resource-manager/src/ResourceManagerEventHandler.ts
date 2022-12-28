/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { ISessionEvent, SessionEventSource, TopicEventHandler, SessionEventTopic, SessionEventId } from '@cloudbeaver/core-root';
import type { CbrmEvent as IResourceManagerEvent } from '@cloudbeaver/core-sdk';

@injectable()
export class ResourceManagerEventHandler
  extends TopicEventHandler<IResourceManagerEvent, ISessionEvent, SessionEventId, SessionEventTopic> {
  constructor(
    sessionEventSource: SessionEventSource
  ) {
    super(SessionEventTopic.CbScripts, sessionEventSource);
  }

  map(event: any): IResourceManagerEvent {
    return event;
  }
}
