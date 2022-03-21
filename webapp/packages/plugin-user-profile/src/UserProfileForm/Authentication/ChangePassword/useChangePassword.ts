/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, computed, observable } from 'mobx';

import { UsersResource } from '@cloudbeaver/core-authentication';
import { useObservableRef } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';

interface IConfig {
  oldPassword: string;
  password: string;
  repeatedPassword: string;
}

interface IState {
  config: IConfig;
  submitting: boolean;
  readonly formFilled: boolean;
  changePassword: () => Promise<void>;
  resetConfig: () => void;
}

export function useChangePassword(): IState {
  const usersResource = useService(UsersResource);
  const notificationService = useService(NotificationService);

  return useObservableRef(() => ({
    config: {
      oldPassword: '',
      password: '',
      repeatedPassword: '',
    },
    submitting: false,
    get formFilled() {
      return this.config.password.length > 0 && this.config.oldPassword.length > 0
        && this.config.repeatedPassword.length > 0;
    },
    async changePassword() {
      if (this.config.password !== this.config.repeatedPassword) {
        this.notificationService.logError({ title: 'plugin_user_profile_authentication_change_password_passwords_not_match' });
        return;
      }

      try {
        this.submitting = true;
        await usersResource.updateLocalPassword(this.config.oldPassword, this.config.password);
        notificationService.logSuccess({ title: 'plugin_user_profile_authentication_change_password_success' });
        this.resetConfig();
      } catch (exception: any) {
        notificationService.logException(exception);
      } finally {
        this.submitting = false;
      }
    },
    resetConfig() {
      this.config.oldPassword = '';
      this.config.password = '';
      this.config.repeatedPassword = '';
    },
  }),
  {
    config: observable,
    submitting: observable.ref,
    formFilled: computed,
    changePassword: action.bound,
    resetConfig: action,
  },
  { usersResource, notificationService });
}
