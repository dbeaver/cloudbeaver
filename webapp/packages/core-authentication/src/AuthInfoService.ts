/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { type ITask, AutoRunningTask } from '@cloudbeaver/core-executor';
import { WindowsService } from '@cloudbeaver/core-routing';
import { AuthInfo, AuthStatus, UserInfo } from '@cloudbeaver/core-sdk';
import { uuid } from '@cloudbeaver/core-utils';

import { AuthProvidersResource, AuthProviderConfiguration } from './AuthProvidersResource';
import { type ILoginOptions, UserInfoResource } from './UserInfoResource';

export interface IUserAuthConfiguration {
  providerId: string;
  configuration: AuthProviderConfiguration;
}

@injectable()
export class AuthInfoService {
  get userInfo(): UserInfo | null {
    return this.userInfoResource.data;
  }

  get userAuthConfigurations(): IUserAuthConfiguration[] {
    const tokens = this.userInfo?.authTokens;
    const result: IUserAuthConfiguration[] = [];

    if (!tokens) {
      return result;
    }

    for (const token of tokens) {
      if (token.authConfiguration) {
        const provider = this.authProvidersResource.values.find(
          provider => provider.id === token.authProvider
        );

        if (provider) {
          const configuration = provider.configurations?.find(
            configuration => configuration.id === token.authConfiguration
          );

          if (configuration) {
            result.push({ providerId: provider.id, configuration });
          }
        }
      }
    }

    return result;
  }

  constructor(
    private readonly userInfoResource: UserInfoResource,
    private readonly authProvidersResource: AuthProvidersResource,
    private readonly windowsService: WindowsService
  ) {
  }

  login(providerId: string, options: ILoginOptions): ITask<UserInfo | null> {
    return new AutoRunningTask(async () => await this.userInfoResource.login(providerId, options))
      .then(authInfo => this.federatedAuthentication(providerId, options, authInfo));
  }

  async logout(): Promise<void> {
    await this.userInfoResource.logout();
  }

  private federatedAuthentication(
    providerId: string,
    options: ILoginOptions,
    { redirectLink, authId, authStatus }: AuthInfo
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

    return new AutoRunningTask(() => {
      if (authId && authStatus === AuthStatus.InProgress) {
        return this.userInfoResource.finishFederatedAuthentication(authId, options.linkUser);
      }

      return AutoRunningTask.resolve(this.userInfoResource.data);
    }, () => {
      if (window) {
        this.windowsService.close(window);
      }
    });
  }
}
