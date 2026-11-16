/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { CachedDataResource } from '@cloudbeaver/core-resource';

import { SessionResource } from './SessionResource.js';

export class SessionDataResourceImpl extends CachedDataResource<null> {
  constructor(sessionResource: SessionResource) {
    super(() => null);

    this.sync(
      sessionResource,
      () => {},
      () => {},
    );
  }

  protected async loader(): Promise<null> {
    return null;
  }
}

export type SessionDataResource = SessionDataResourceImpl;

export class SessionDataResourceDI extends Context.Service<SessionDataResourceDI, SessionDataResourceImpl>()(
  '@cloudbeaver/core-root/SessionDataResource#SessionDataResource',
) {
  static readonly implementation = SessionDataResourceImpl;

  static readonly dependencies = () => [SessionResource] as const;
  static readonly make: Effect.Effect<SessionDataResourceImpl, never, Context.Service.Identifier<typeof SessionResource>> = Effect.gen(
    function* makeSessionDataResource() {
      const sessionResource = yield* SessionResource;

      return new SessionDataResourceImpl(sessionResource);
    },
  );
  static readonly layer: Layer.Layer<SessionDataResourceDI, never, Context.Service.Identifier<typeof SessionResource>> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const SessionDataResource = SessionDataResourceDI;
