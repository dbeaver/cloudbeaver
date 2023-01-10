/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { SessionEventSource, TopicEventHandler, ISessionEvent, ClientEventId, SessionEventTopic, IBaseServerEvent, SessionEventId } from '@cloudbeaver/core-root';
import type { CbProjectsActiveEvent } from '@cloudbeaver/core-sdk';
import { isArraysEqual } from '@cloudbeaver/core-utils';

export type IProjectInfoEvent = IBaseServerEvent<SessionEventId, SessionEventTopic>;

@injectable()
export class ProjectInfoEventHandler
  extends TopicEventHandler<IProjectInfoEvent, ISessionEvent, SessionEventId, SessionEventTopic> {
  private lastActiveProjects: string[];

  constructor(
    sessionEventSource: SessionEventSource
  ) {
    super(SessionEventTopic.CbProjects, sessionEventSource);
    this.lastActiveProjects = [];

    this.onInit.addHandler(() => {
      this.lastActiveProjects = [];
    });
  }

  setActiveProjects(projectIds: string[]): void {
    if (isArraysEqual(this.lastActiveProjects, projectIds)) {
      return;
    }

    this.emit<CbProjectsActiveEvent>({ id: ClientEventId.CbClientProjectsActive, projectIds });
    this.lastActiveProjects = projectIds;
  }

  map(event: ISessionEvent): IProjectInfoEvent {
    return event;
  }
}
