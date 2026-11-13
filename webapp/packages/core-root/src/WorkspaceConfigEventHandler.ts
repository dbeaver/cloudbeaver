/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import type { CbServerEvent } from '@cloudbeaver/core-sdk';
import { TopicEventHandler } from './ServerEventEmitter/TopicEventHandler.js';
import { SessionEventSource, SessionEventTopic, type ISessionEvent } from './SessionEventSource.js';

export class WorkspaceConfigEventHandlerImpl extends TopicEventHandler<CbServerEvent, ISessionEvent> {
  constructor(sessionEventSource: SessionEventSource) {
    super(SessionEventTopic.CbWorkspaceConfiguration, sessionEventSource);
  }

  map(event: any) {
    return event;
  }
}

export type WorkspaceConfigEventHandler = WorkspaceConfigEventHandlerImpl;

export class WorkspaceConfigEventHandlerDI extends Context.Service<WorkspaceConfigEventHandlerDI, WorkspaceConfigEventHandlerImpl>()(
  '@cloudbeaver/core-root/WorkspaceConfigEventHandler#WorkspaceConfigEventHandler',
) {
  static readonly implementation = WorkspaceConfigEventHandlerImpl;

  static readonly dependencies = () => [SessionEventSource] as const;
  static readonly make: Effect.Effect<WorkspaceConfigEventHandlerImpl, never, Context.Service.Identifier<typeof SessionEventSource>> = Effect.gen(
    function* makeWorkspaceConfigEventHandler() {
      const sessionEventSource = yield* SessionEventSource;

      return new WorkspaceConfigEventHandlerImpl(sessionEventSource);
    },
  );
  static readonly layer: Layer.Layer<WorkspaceConfigEventHandlerDI, never, Context.Service.Identifier<typeof SessionEventSource>> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const WorkspaceConfigEventHandler = WorkspaceConfigEventHandlerDI;
