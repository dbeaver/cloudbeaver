/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { SessionEventSource, TopicEventHandler, ISessionEvent, ClientEventType, SessionEventTopic } from '@cloudbeaver/core-root';

export type IProjectInfoEvent = void;

@injectable()
export class ProjectInfoEventHandler extends TopicEventHandler<IProjectInfoEvent, ISessionEvent> {
  constructor(
    sessionEventSource: SessionEventSource
  ) {
    super(SessionEventTopic.CbProjects, sessionEventSource);
  }

  setActiveProjects(projects: string[]): void {
    this.emit({ type: ClientEventType.CbClientProjectsActive, projects });
  }

  map(): IProjectInfoEvent {
  }
}
