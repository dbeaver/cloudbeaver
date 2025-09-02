/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import type { CbServerEvent } from '@cloudbeaver/core-sdk';
import { SessionEventSource, SessionEventTopic, type ISessionEvent } from './SessionEventSource.js';
import { TopicEventHandler } from './ServerEventEmitter/TopicEventHandler.js';

@injectable(() => [SessionEventSource])
export class WorkspaceConfigEventHandler extends TopicEventHandler<CbServerEvent, ISessionEvent> {
  constructor(sessionEventSource: SessionEventSource) {
    super(SessionEventTopic.CbWorkspaceConfiguration, sessionEventSource);
  }

  map(event: any) {
    return event;
  }
}
