/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import type { UserInfo } from '@cloudbeaver/core-sdk';

import { UserInfoResource } from './UserInfoResource';

@injectable()
export class AuthInfoService {
  constructor(
    private userInfoResource: UserInfoResource,
  ) { }

  get userInfo(): UserInfo | null {
    return this.userInfoResource.data;
  }

  async login(provider: string, credentials: Record<string, string>, link?: boolean): Promise<UserInfo | null> {
    return this.userInfoResource.login(provider, credentials, link);
  }

  async logout(): Promise<void> {
    await this.userInfoResource.logout();
  }
}
