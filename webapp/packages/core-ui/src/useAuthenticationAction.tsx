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
import type { ObjectOrigin } from '@cloudbeaver/core-sdk';

interface IAuthenticationAction {
  type: string;
  subType?: string;
  authorized: boolean;
  auth: () => Promise<void>;
}

export type Options = {
  onAuthenticate?: () => Promise<any> | void;
  onClose?: () => Promise<void> | void;
} & ({
  origin: ObjectOrigin;
} | {
  type: string;
  subType?: string;
});

export function useAuthenticationAction(options: Options): IAuthenticationAction {
  const authProviderService = useService(AuthProviderService);
  const userInfoService = useService(UserInfoResource);
  let type: string;
  let subType: string | undefined;

  if ('origin' in options) {
    type = options.origin.type;
    subType = options.origin.subType;
  } else {
    type = options.type;
    subType = options.subType;
  }

  return useObservableRef(() => ({
    authenticating: false,
    get authorized() {
      return !this.authenticating && userInfoService.hasToken(this.type, this.subType);
    },
    async auth() {
      this.authenticating = true;
      try {
        const result = await authProviderService.requireProvider(this.type, this.subType);

        if (result) {
          await this.onAuthenticate?.();
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
  }, {
    type,
    subType,
    onAuthenticate: options.onAuthenticate,
    onClose: options.onClose,
  }, ['auth']);
}
