/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed, observable } from 'mobx';

import { AuthProviderService, UserInfoResource } from '@cloudbeaver/core-authentication';
import { useService } from '@cloudbeaver/core-di';
import { useObservableRef } from './useObservableRef.js';

interface IAuthenticationAction {
  providerId: string;
  authorized: boolean;
  authenticating: boolean;
  auth(): Promise<void>;
}

export type Options = {
  onAuthenticate?: () => Promise<any> | void;
  onClose?: () => Promise<void> | void;
  providerId: string;
};

export function useAuthenticationAction(options: Options): IAuthenticationAction {
  const authProviderService = useService(AuthProviderService);
  const userInfoService = useService(UserInfoResource);

  return useObservableRef(
    () => ({
      authenticating: false,
      get authorized() {
        return !this.authenticating && userInfoService.hasToken(this.providerId);
      },
      async auth() {
        this.authenticating = true;
        try {
          const result = await authProviderService.requireProvider(this.providerId);

          if (result) {
            await this.onAuthenticate?.();
          } else {
            await this.onClose?.();
          }
        } finally {
          this.authenticating = false;
        }
      },
    }),
    {
      authorized: computed,
      authenticating: observable.ref,
      providerId: observable.ref,
    },
    {
      providerId: options.providerId,
      onAuthenticate: options.onAuthenticate,
      onClose: options.onClose,
    },
    ['auth'],
  );
}
