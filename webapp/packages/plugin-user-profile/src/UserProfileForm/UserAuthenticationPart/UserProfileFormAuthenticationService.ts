/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, makeObservable, observable } from 'mobx';

import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';

import type { IUserProfileFormAuthenticationState } from './IUserProfileFormAuthenticationState.js';

export class UserProfileFormAuthenticationServiceImpl {
  readonly state: IUserProfileFormAuthenticationState;

  constructor() {
    this.state = {
      oldPassword: '',
      password: '',
      repeatedPassword: '',
    };

    makeObservable(this, {
      state: observable,
      reset: action,
    });
  }

  isEdited(): boolean {
    return !!(this.state.oldPassword || this.state.password || this.state.repeatedPassword);
  }

  reset(): void {
    this.state.oldPassword = '';
    this.state.password = '';
    this.state.repeatedPassword = '';
  }
}

export type UserProfileFormAuthenticationService = UserProfileFormAuthenticationServiceImpl;

export class UserProfileFormAuthenticationServiceDI extends Context.Service<
  UserProfileFormAuthenticationServiceDI,
  UserProfileFormAuthenticationServiceImpl
>()(
  '@cloudbeaver/plugin-user-profile/UserProfileForm/UserAuthenticationPart/UserProfileFormAuthenticationService#UserProfileFormAuthenticationService',
) {
  static readonly implementation = UserProfileFormAuthenticationServiceImpl;

  static readonly dependencies = () => [] as const;
  static readonly make: Effect.Effect<UserProfileFormAuthenticationServiceImpl, never, never> = Effect.sync(
    () => new UserProfileFormAuthenticationServiceImpl(),
  );
  static readonly layer: Layer.Layer<UserProfileFormAuthenticationServiceDI, never, never> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const UserProfileFormAuthenticationService = UserProfileFormAuthenticationServiceDI;
