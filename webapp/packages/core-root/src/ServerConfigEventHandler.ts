/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';

import { TopicEventHandler } from './ServerEventEmitter/TopicEventHandler';
import { ISessionEvent, SessionEventSource, SessionEventType } from './SessionEventSource';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IServerConfigEvent {
}

@injectable()
export class ServerConfigEventHandler extends TopicEventHandler<IServerConfigEvent, ISessionEvent> {
  constructor(
    sessionEventSource: SessionEventSource
  ) {
    super(SessionEventType.CbConfigChanged, sessionEventSource);
  }

  map() {
    return {};
  }
}
