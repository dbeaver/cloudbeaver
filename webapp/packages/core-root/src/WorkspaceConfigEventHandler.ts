/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import type { CbConfigEvent as IWorkspaceConfigEvent } from '@cloudbeaver/core-sdk';

import { TopicEventHandler } from './ServerEventEmitter/TopicEventHandler.js';
import { type ISessionEvent, SessionEventSource, SessionEventTopic } from './SessionEventSource.js';

export { type IWorkspaceConfigEvent };

@injectable()
export class WorkspaceConfigEventHandler extends TopicEventHandler<IWorkspaceConfigEvent, ISessionEvent> {
  constructor(sessionEventSource: SessionEventSource) {
    console.log('WorkspaceConfigEventHandler subscribed');
    super(SessionEventTopic.CbWorkspaceConfiguration, sessionEventSource);
  }

  map(event: any): IWorkspaceConfigEvent {
    return event;
  }
}
