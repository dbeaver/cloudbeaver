/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import type { WsObjectSettingsEvent } from '@cloudbeaver/core-sdk';

import { TopicEventHandler } from './ServerEventEmitter/TopicEventHandler.js';
import { type ISessionEvent, type SessionEventId, SessionEventSource, SessionEventTopic } from './SessionEventSource.js';

export type IObjectSettingsEvent = WsObjectSettingsEvent;

export class ObjectSettingsEventHandlerImpl extends TopicEventHandler<IObjectSettingsEvent, ISessionEvent, SessionEventId, SessionEventTopic> {
  constructor(sessionEventSource: SessionEventSource) {
    super(SessionEventTopic.CbObjectSettings, sessionEventSource);
  }

  map(event: any): IObjectSettingsEvent {
    return event;
  }
}

export type ObjectSettingsEventHandler = ObjectSettingsEventHandlerImpl;

export class ObjectSettingsEventHandlerDI extends Context.Service<ObjectSettingsEventHandlerDI, ObjectSettingsEventHandlerImpl>()(
  '@cloudbeaver/core-root/ObjectSettingsEventHandler#ObjectSettingsEventHandler',
) {
  static readonly implementation = ObjectSettingsEventHandlerImpl;

  static readonly dependencies = () => [SessionEventSource] as const;
  static readonly make: Effect.Effect<ObjectSettingsEventHandlerImpl, never, Context.Service.Identifier<typeof SessionEventSource>> = Effect.gen(
    function* makeObjectSettingsEventHandler() {
      const sessionEventSource = yield* SessionEventSource;

      return new ObjectSettingsEventHandlerImpl(sessionEventSource);
    },
  );
  static readonly layer: Layer.Layer<ObjectSettingsEventHandlerDI, never, Context.Service.Identifier<typeof SessionEventSource>> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const ObjectSettingsEventHandler = ObjectSettingsEventHandlerDI;
