/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { AutoRunningTask, type ITask } from '@cloudbeaver/core-executor';
import { WindowsService } from '@cloudbeaver/core-routing';
import { type AuthInfo, AuthStatus, type UserInfo } from '@cloudbeaver/core-sdk';
import { uuid } from '@cloudbeaver/core-utils';

import { type AuthProviderConfiguration, AuthProvidersResource } from './AuthProvidersResource.js';
import { type ILoginOptions, UserInfoResource } from './UserInfoResource.js';

export interface IUserAuthConfiguration {
  providerId: string;
  configuration: AuthProviderConfiguration;
}

@injectable()
export class AuthInfoService {
  get userInfo(): UserInfo | null {
    return this.userInfoResource.data;
  }

  constructor(
    private readonly userInfoResource: UserInfoResource,
    private readonly authProvidersResource: AuthProvidersResource,
    private readonly windowsService: WindowsService,
  ) {}

  login(providerId: string, options: ILoginOptions): ITask<UserInfo | null> {
    return new AutoRunningTask(async () => await this.userInfoResource.login(providerId, options)).then(authInfo =>
      this.federatedAuthentication(providerId, options, authInfo),
    );
  }

  private federatedAuthentication(
    providerId: string,
    options: ILoginOptions,
    { redirectLink, authId, authStatus }: AuthInfo,
  ): ITask<UserInfo | null> {
    let window: Window | null = null;
    let id = providerId;

    if (options.configurationId) {
      const configuration = this.authProvidersResource.getConfiguration(providerId, options.configurationId);

      if (configuration) {
        id = configuration.id;
      }
    }

    if (redirectLink) {
      id = uuid();
      window = this.windowsService.open(id, {
        url: redirectLink,
        target: id,
        width: 600,
        height: 700,
      });

      if (window) {
        window.focus();
      }
    }

    return new AutoRunningTask(
      () => {
        if (authId && authStatus === AuthStatus.InProgress) {
          return this.userInfoResource.finishFederatedAuthentication(authId, options.linkUser);
        }

        return AutoRunningTask.resolve(this.userInfoResource.data);
      },
      () => {
        if (window) {
          this.windowsService.close(window);
        }
      },
    );
  }
}
