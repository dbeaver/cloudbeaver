/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { SessionResource } from '@cloudbeaver/core-root';
import type { AuthProviderConfiguration, UserInfo } from '@cloudbeaver/core-sdk';
import { openCenteredPopup } from '@cloudbeaver/core-utils';

import { AuthProvidersResource } from './AuthProvidersResource';
import type { IAuthCredentials } from './IAuthCredentials';
import { UserInfoResource } from './UserInfoResource';

interface IActiveSSOAuthentication {
  configuration: AuthProviderConfiguration;
  window: Window;
  promise: Promise<UserInfo | null>;
}

@injectable()
export class AuthInfoService {
  get userInfo(): UserInfo | null {
    return this.userInfoResource.data;
  }

  get userAuthConfigurations(): AuthProviderConfiguration[] {
    const tokens = this.userInfo?.authTokens;
    const result: AuthProviderConfiguration[] = [];

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
            result.push(configuration);
          }
        }
      }
    }

    return result;
  }

  private readonly activeSSO: Map<string, IActiveSSOAuthentication>;

  constructor(
    private readonly userInfoResource: UserInfoResource,
    private readonly authProvidersResource: AuthProvidersResource,
    private readonly sessionResource: SessionResource
  ) {
    this.activeSSO = new Map();
  }

  async login(provider: string, credentials: IAuthCredentials, link?: boolean): Promise<UserInfo | null> {
    return this.userInfoResource.login(provider, credentials, link);
  }

  async sso(providerId: string, configuration: AuthProviderConfiguration): Promise<UserInfo | null> {
    return this.ssoAuth(providerId, configuration);
  }

  async logout(): Promise<void> {
    await this.userInfoResource.logout();
  }

  private async ssoAuth(providerId: string, configuration: AuthProviderConfiguration): Promise<UserInfo | null> {
    const active = this.activeSSO.get(configuration.id);

    if (active) {
      active.window.focus();
      return active.promise;
    }

    const popup = openCenteredPopup(configuration.signInLink, configuration.id, 600, 700, undefined);

    if (popup) {
      popup.focus();

      const task = async () => {
        await this.waitWindowsClose(popup);

        this.sessionResource.markOutdated();
        const user = await this.userInfoResource.load(undefined, []);

        return user;
      };

      const active: IActiveSSOAuthentication = {
        configuration,
        promise: task(),
        window: popup,
      };

      this.activeSSO.set(configuration.id, active);
      try {
        return await active.promise;
      } finally {
        this.activeSSO.delete(configuration.id);
      }
    }

    return Promise.resolve(null);
  }

  private async waitWindowsClose(window: Window): Promise<void> {
    return new Promise(resolve => {
      setInterval(() => {
        if (window.closed) {
          resolve();
        }
      }, 100);
    });
  }
}
