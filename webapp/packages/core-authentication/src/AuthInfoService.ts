/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { SessionService } from '@cloudbeaver/core-root';
import { GraphQLService, UserAuthInfo } from '@cloudbeaver/core-sdk';

import { AuthProviderService } from './AuthProviderService';

@injectable()
export class AuthInfoService {
  @observable private user: UserAuthInfo | null = null;

  constructor(
    private graphQLService: GraphQLService,
    private notificationService: NotificationService,
    private authProviderService: AuthProviderService,
    private sessionService: SessionService,
  ) { }

  get userInfo(): UserAuthInfo | null {
    return this.user;
  }

  async login(provider: string, credentials: Record<string, string>): Promise<UserAuthInfo> {
    if (this.user) {
      throw new Error('User already logged in');
    }

    const processedCredentials = await this.authProviderService.processCredentials(provider, credentials);

    const { user } = await this.graphQLService.sdk.authLogin({
      provider,
      credentials: processedCredentials,
    });
    this.user = user;

    await this.updateSession();
    return this.user;
  }

  async logout(): Promise<void> {
    if (this.user) {
      await this.graphQLService.sdk.authLogout();
      this.user = null;
      await this.updateSession();
    }
  }

  async updateAuthInfo(): Promise<UserAuthInfo | null> {
    try {
      const { user } = await this.graphQLService.sdk.getSessionUser();
      this.user = user || null;
    } catch (exception) {
      this.notificationService.logException(exception, 'Can\'t load session user');
    }

    return this.user;
  }

  private async updateSession() {
    await this.sessionService.update();
  }
}
