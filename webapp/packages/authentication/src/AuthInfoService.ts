/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';

import { injectable } from '@dbeaver/core/di';
import { NotificationService } from '@dbeaver/core/eventsLog';
import { GraphQLService, UserAuthInfo } from '@dbeaver/core/sdk';

import { AuthProviderService } from './AuthProviderService';

@injectable()
export class AuthInfoService {
  @observable private user: UserAuthInfo | null = null;

  constructor(
    private graphQLService: GraphQLService,
    private notificationService: NotificationService,
    private authProviderService: AuthProviderService,
  ) { }

  get userInfo() {
    return this.user;
  }

  async login(provider: string, credentials: object): Promise<UserAuthInfo> {
    if (this.user) {
      throw new Error('User already logged in');
    }
    const processedCredentials = this.authProviderService.processCredentials(provider, credentials);

    const { user } = await this.graphQLService.gql.authLogin({
      provider,
      credentials: processedCredentials,
    });
    this.user = user;

    return this.user;
  }

  async logout() {
    if (this.user) {
      await this.graphQLService.gql.authLogout();
      this.user = null;
    }
  }

  async updateAuthInfo(): Promise<UserAuthInfo | null> {
    try {
      const { user } = await this.graphQLService.gql.getSessionUser();
      this.user = user || null;
    } catch (exception) {
      this.notificationService.logException(exception, 'Can\'t load session user');
    }

    return this.user;
  }
}
