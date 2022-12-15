/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { SessionEventSource, TopicEventHandler, ISessionEvent, ClientEventId, SessionEventTopic, IBaseServerEvent, SessionEventId } from '@cloudbeaver/core-root';

export type IProjectInfoEvent = IBaseServerEvent<SessionEventId, SessionEventTopic>;

@injectable()
export class ProjectInfoEventHandler
  extends TopicEventHandler<IProjectInfoEvent, ISessionEvent, SessionEventId, SessionEventTopic> {
  constructor(
    sessionEventSource: SessionEventSource
  ) {
    super(SessionEventTopic.CbProjects, sessionEventSource);
  }

  setActiveProjects(projects: string[]): void {
    this.emit({ id: ClientEventId.CbClientProjectsActive, projects });
  }

  map(event: ISessionEvent): IProjectInfoEvent {
    return event;
  }
}
