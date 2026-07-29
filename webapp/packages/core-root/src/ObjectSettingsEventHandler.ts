/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import type { WsObjectSettingsEvent } from '@cloudbeaver/core-sdk';

import { TopicEventHandler } from './ServerEventEmitter/TopicEventHandler.js';
import { type ISessionEvent, type SessionEventId, SessionEventSource, SessionEventTopic } from './SessionEventSource.js';

export type IObjectSettingsEvent = WsObjectSettingsEvent;

@injectable(() => [SessionEventSource])
export class ObjectSettingsEventHandler extends TopicEventHandler<IObjectSettingsEvent, ISessionEvent, SessionEventId, SessionEventTopic> {
  constructor(sessionEventSource: SessionEventSource) {
    super(SessionEventTopic.CbObjectSettings, sessionEventSource);
  }

  map(event: any): IObjectSettingsEvent {
    return event;
  }
}
