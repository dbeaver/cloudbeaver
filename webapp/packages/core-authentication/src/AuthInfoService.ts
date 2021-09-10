/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { SessionDataResource } from '@cloudbeaver/core-root';
import type { AuthProviderConfiguration, UserInfo } from '@cloudbeaver/core-sdk';

import { UserInfoResource } from './UserInfoResource';

@injectable()
export class AuthInfoService {
  get userInfo(): UserInfo | null {
    return this.userInfoResource.data;
  }

  private activeSSO: Promise<UserInfo | null> | null;

  constructor(
    private userInfoResource: UserInfoResource,
    private sessionDataResource: SessionDataResource
  ) {
    this.activeSSO = null;
  }

  async login(provider: string, credentials: Record<string, string>, link?: boolean): Promise<UserInfo | null> {
    return this.userInfoResource.login(provider, credentials, link);
  }

  async sso(providerId: string, configuration: AuthProviderConfiguration): Promise<UserInfo | null> {
    if (!this.activeSSO) {
      this.activeSSO = this.ssoAuth(providerId, configuration);
    }

    try {
      return await this.activeSSO;
    } finally {
      this.activeSSO = null;
    }
  }

  async logout(): Promise<void> {
    await this.userInfoResource.logout();
  }

  private async ssoAuth(providerId: string, configuration: AuthProviderConfiguration): Promise<UserInfo | null> {
    const w = 600;
    const h = 700;
    const systemZoom = window.top.outerWidth / window.screen.availWidth;
    const top = (window.top.outerHeight - h) / 2 / systemZoom + window.top.screenY;
    const left = (window.top.outerWidth - w) / 2 / systemZoom + window.top.screenX;
    const strWindowFeatures = `toolbar=no, menubar=no, width=${w / systemZoom}, height=${h / systemZoom}, top=${top}, left=${left}`;
    const popup = window.open(configuration.signInLink, configuration.displayName, strWindowFeatures);

    if (popup) {
      popup.focus();
      await this.waitWindowsClose(popup);
      const user = await this.userInfoResource.refresh();
      await this.sessionDataResource.refresh();
      return user;
    }

    return null;
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
