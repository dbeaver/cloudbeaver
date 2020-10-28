/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { UserAuthInfo } from '@cloudbeaver/core-sdk';

import { UserInfoResource } from './UserInfoResource';

@injectable()
export class AuthInfoService {
  constructor(
    private userInfoResource: UserInfoResource,
  ) { }

  get userInfo(): UserAuthInfo | null {
    return this.userInfoResource.data;
  }

  async login(provider: string, credentials: Record<string, string>): Promise<UserAuthInfo> {
    return this.userInfoResource.login(provider, credentials);
  }

  async logout(): Promise<void> {
    await this.userInfoResource.logout();
  }
}
