/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, makeObservable, observable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';

import type { IUserProfileFormAuthenticationState } from './IUserProfileFormAuthenticationState.js';

@injectable()
export class UserProfileFormAuthenticationService {
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
