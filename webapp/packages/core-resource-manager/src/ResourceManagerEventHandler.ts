/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { type ISessionEvent, type SessionEventId, SessionEventSource, SessionEventTopic, TopicEventHandler } from '@cloudbeaver/core-root';
import type { CbrmEvent as IResourceManagerEvent } from '@cloudbeaver/core-sdk';

export class ResourceManagerEventHandlerImpl extends TopicEventHandler<IResourceManagerEvent, ISessionEvent, SessionEventId, SessionEventTopic> {
  constructor(sessionEventSource: SessionEventSource) {
    super(SessionEventTopic.CbScripts, sessionEventSource);
  }

  map(event: any): IResourceManagerEvent {
    return event;
  }
}

export type ResourceManagerEventHandler = ResourceManagerEventHandlerImpl;

export class ResourceManagerEventHandlerDI extends Context.Service<ResourceManagerEventHandlerDI, ResourceManagerEventHandlerImpl>()(
  '@cloudbeaver/core-resource-manager/ResourceManagerEventHandler#ResourceManagerEventHandler',
) {
  static readonly implementation = ResourceManagerEventHandlerImpl;

  static readonly dependencies = () => [SessionEventSource] as const;
  static readonly make: Effect.Effect<ResourceManagerEventHandlerImpl, never, Context.Service.Identifier<typeof SessionEventSource>> = Effect.gen(
    function* makeResourceManagerEventHandler() {
      const sessionEventSource = yield* SessionEventSource;

      return new ResourceManagerEventHandlerImpl(sessionEventSource);
    },
  );
  static readonly layer: Layer.Layer<ResourceManagerEventHandlerDI, never, Context.Service.Identifier<typeof SessionEventSource>> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const ResourceManagerEventHandler = ResourceManagerEventHandlerDI;
