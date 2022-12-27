/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import type { CbConfigEvent as IServerConfigEvent } from '@cloudbeaver/core-sdk';

import { TopicEventHandler } from './ServerEventEmitter/TopicEventHandler';
import { ISessionEvent, SessionEventSource, SessionEventTopic } from './SessionEventSource';

export { type IServerConfigEvent };

@injectable()
export class ServerConfigEventHandler extends TopicEventHandler<IServerConfigEvent, ISessionEvent> {
  constructor(
    sessionEventSource: SessionEventSource
  ) {
    super(SessionEventTopic.CbConfig, sessionEventSource);
  }

  map(event: any) {
    return event;
  }
}
