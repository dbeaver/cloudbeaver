/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import type { WsSessionExpiredEvent } from '@cloudbeaver/core-sdk';

import { ServerEventId, SessionEventSource } from './SessionEventSource.js';
import { SessionExpireService } from './SessionExpireService.js';

export class SessionExpireEventServiceImpl {
  constructor(
    private readonly sessionEventSource: SessionEventSource,
    private readonly sessionExpireService: SessionExpireService,
  ) {
    this.sessionEventSource.onEvent<WsSessionExpiredEvent>(ServerEventId.CbSessionExpired, () => {
      this.onSessionExpireEvent();
    });
  }

  private onSessionExpireEvent(): void {
    this.sessionExpireService.sessionExpired();
  }
}

export type SessionExpireEventService = SessionExpireEventServiceImpl;

export class SessionExpireEventServiceDI extends Context.Service<SessionExpireEventServiceDI, SessionExpireEventServiceImpl>()(
  '@cloudbeaver/core-root/SessionExpireEventService#SessionExpireEventService',
) {
  static readonly implementation = SessionExpireEventServiceImpl;

  static readonly dependencies = () => [SessionEventSource, SessionExpireService] as const;
  static readonly make: Effect.Effect<
    SessionExpireEventServiceImpl,
    never,
    Context.Service.Identifier<typeof SessionEventSource> | Context.Service.Identifier<typeof SessionExpireService>
  > = Effect.gen(function* makeSessionExpireEventService() {
    const sessionEventSource = yield* SessionEventSource;
    const sessionExpireService = yield* SessionExpireService;

    return new SessionExpireEventServiceImpl(sessionEventSource, sessionExpireService);
  });
  static readonly layer: Layer.Layer<
    SessionExpireEventServiceDI,
    never,
    Context.Service.Identifier<typeof SessionEventSource> | Context.Service.Identifier<typeof SessionExpireService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const SessionExpireEventService = SessionExpireEventServiceDI;
