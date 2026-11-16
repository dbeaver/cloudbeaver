/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { ClientActivityService } from '@cloudbeaver/core-client-activity';
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';

import { SessionResource } from './SessionResource.js';

export const SESSION_TOUCH_TIME_PERIOD = 1000 * 60;

export class SessionActivityServiceImpl {
  private touchSessionTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly clientActivityService: ClientActivityService,
    private readonly sessionResource: SessionResource,
  ) {
    this.notifyClientActivity = this.notifyClientActivity.bind(this);
    this.clientActivityService.onActiveStateChange.addHandler(this.notifyClientActivity);
  }

  private notifyClientActivity() {
    if (this.touchSessionTimer || !this.clientActivityService.isActive) {
      return;
    }

    this.sessionResource.pingSession();

    this.touchSessionTimer = setTimeout(() => {
      if (this.touchSessionTimer) {
        clearTimeout(this.touchSessionTimer);
        this.touchSessionTimer = null;
      }
    }, SESSION_TOUCH_TIME_PERIOD);
  }
}

export type SessionActivityService = SessionActivityServiceImpl;

export class SessionActivityServiceDI extends Context.Service<SessionActivityServiceDI, SessionActivityServiceImpl>()(
  '@cloudbeaver/core-root/SessionActivityService#SessionActivityService',
) {
  static readonly implementation = SessionActivityServiceImpl;

  static readonly dependencies = () => [ClientActivityService, SessionResource] as const;
  static readonly make: Effect.Effect<
    SessionActivityServiceImpl,
    never,
    Context.Service.Identifier<typeof ClientActivityService> | Context.Service.Identifier<typeof SessionResource>
  > = Effect.gen(function* makeSessionActivityService() {
    const clientActivityService = yield* ClientActivityService;
    const sessionResource = yield* SessionResource;

    return new SessionActivityServiceImpl(clientActivityService, sessionResource);
  });
  static readonly layer: Layer.Layer<
    SessionActivityServiceDI,
    never,
    Context.Service.Identifier<typeof ClientActivityService> | Context.Service.Identifier<typeof SessionResource>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const SessionActivityService = SessionActivityServiceDI;
