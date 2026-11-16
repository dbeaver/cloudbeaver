/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { PlaceholderContainer } from '@cloudbeaver/core-blocks';
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';

import type { UserFormProps } from '../AdministrationUserFormService.js';

export class UserFormInfoPartServiceImpl {
  placeholderContainer: PlaceholderContainer<UserFormProps>;
  constructor() {
    this.placeholderContainer = new PlaceholderContainer();
  }
}

export type UserFormInfoPartService = UserFormInfoPartServiceImpl;

export class UserFormInfoPartServiceDI extends Context.Service<UserFormInfoPartServiceDI, UserFormInfoPartServiceImpl>()(
  '@cloudbeaver/plugin-authentication-administration/Administration/Users/UserForm/Info/UserFormInfoPartService#UserFormInfoPartService',
) {
  static readonly implementation = UserFormInfoPartServiceImpl;

  static readonly dependencies = () => [] as const;
  static readonly make: Effect.Effect<UserFormInfoPartServiceImpl, never, never> = Effect.sync(() => new UserFormInfoPartServiceImpl());
  static readonly layer: Layer.Layer<UserFormInfoPartServiceDI, never, never> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const UserFormInfoPartService = UserFormInfoPartServiceDI;
