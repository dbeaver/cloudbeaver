/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';

export class UserFormBaseBootstrapImpl extends Bootstrap {
  constructor() {
    super();
  }
}

export type UserFormBaseBootstrap = UserFormBaseBootstrapImpl;

export class UserFormBaseBootstrapDI extends Context.Service<UserFormBaseBootstrapDI, UserFormBaseBootstrapImpl>()(
  '@cloudbeaver/plugin-authentication-administration/Administration/Users/UserForm/UserFormBaseBootstrap#UserFormBaseBootstrap',
) {
  static readonly implementation = UserFormBaseBootstrapImpl;

  static readonly dependencies = () => [] as const;
  static readonly make: Effect.Effect<UserFormBaseBootstrapImpl, never, never> = Effect.sync(() => new UserFormBaseBootstrapImpl());
  static readonly layer: Layer.Layer<UserFormBaseBootstrapDI, never, never> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const UserFormBaseBootstrap = UserFormBaseBootstrapDI;
