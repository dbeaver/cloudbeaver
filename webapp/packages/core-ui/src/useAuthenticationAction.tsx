/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed, observable } from 'mobx';

import { AuthProviderService, UserInfoResource } from '@cloudbeaver/core-authentication';
import { useObservableRef } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';

interface IAuthenticationAction {
  providerId: string | undefined;
  authorized: boolean;
  authenticating: boolean;
  isAuthorized(providerId?: string): boolean;
  auth(providerId?: string): Promise<void>;
}

export type Options = {
  onAuthenticate?: (id: string) => Promise<any> | void;
  onClose?: () => Promise<void> | void;
  providerId?: string;
};

export function useAuthenticationAction(options: Options): IAuthenticationAction {
  const authProviderService = useService(AuthProviderService);
  const userInfoService = useService(UserInfoResource);

  return useObservableRef(() => ({
    authenticating: false,
    get authorized() {
      return this.isAuthorized(this.providerId);
    },
    isAuthorized(providerId?: string) {
      const provider = providerId || this.providerId;
      if (!provider) {
        throw new Error('providerId must be provided');
      }

      return !this.authenticating && userInfoService.hasToken(provider);
    },
    async auth(providerId?: string) {
      const provider = providerId || this.providerId;
      if (!provider) {
        throw new Error('providerId must be provided');
      }

      this.authenticating = true;
      try {
        const result = await authProviderService.requireProvider(provider);

        if (result) {
          await this.onAuthenticate?.(provider);
        } else {
          await this.onClose?.();
        }
      } finally {
        this.authenticating = false;
      }
    },
  }), {
    authorized: computed,
    authenticating: observable.ref,
    providerId: observable.ref,
  }, {
    providerId: options.providerId,
    onAuthenticate: options.onAuthenticate,
    onClose: options.onClose,
  }, ['auth']);
}
