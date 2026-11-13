/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import {
  ClientEventId,
  type ISessionEvent,
  type SessionEventId,
  SessionEventSource,
  SessionEventTopic,
  TopicEventHandler,
} from '@cloudbeaver/core-root';
import type { CbProjectsActiveEvent, CbProjectUpdateEvent as IProjectInfoEvent } from '@cloudbeaver/core-sdk';
import { isArraysEqual } from '@cloudbeaver/core-utils';

export type { IProjectInfoEvent };

export class ProjectInfoEventHandlerImpl extends TopicEventHandler<IProjectInfoEvent, ISessionEvent, SessionEventId, SessionEventTopic> {
  private lastActiveProjects: string[];

  constructor(sessionEventSource: SessionEventSource) {
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

  map(event: any): IProjectInfoEvent {
    return event;
  }
}

export type ProjectInfoEventHandler = ProjectInfoEventHandlerImpl;

export class ProjectInfoEventHandlerDI extends Context.Service<ProjectInfoEventHandlerDI, ProjectInfoEventHandlerImpl>()(
  '@cloudbeaver/core-projects/ProjectInfoEventHandler#ProjectInfoEventHandler',
) {
  static readonly implementation = ProjectInfoEventHandlerImpl;

  static readonly dependencies = () => [SessionEventSource] as const;
  static readonly make: Effect.Effect<ProjectInfoEventHandlerImpl, never, Context.Service.Identifier<typeof SessionEventSource>> = Effect.gen(
    function* makeProjectInfoEventHandler() {
      const sessionEventSource = yield* SessionEventSource;

      return new ProjectInfoEventHandlerImpl(sessionEventSource);
    },
  );
  static readonly layer: Layer.Layer<ProjectInfoEventHandlerDI, never, Context.Service.Identifier<typeof SessionEventSource>> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const ProjectInfoEventHandler = ProjectInfoEventHandlerDI;
