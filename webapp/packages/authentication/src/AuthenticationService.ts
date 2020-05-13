/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@dbeaver/core/di';
import { ServerService } from '@dbeaver/core/root';

import { AuthInfoService } from './AuthInfoService';
import { AuthDialogService } from './Dialog/AuthDialogService';

@injectable()
export class AuthenticationService {
  constructor(
    private serverService: ServerService,
    private authDialogService: AuthDialogService,
    private authInfoService: AuthInfoService,
  ) { }

  async auth() {
    if (await this.isForceAuthentication()) {
      await this.authDialogService.showLoginForm(true);
    }
  }

  async isForceAuthentication() {
    const config = await this.serverService.config.load();
    if (!config) {
      throw new Error('Can\'t configure Authentication');
    }
    const userInfo = await this.authInfoService.updateAuthInfo();

    return !config.anonymousAccessEnabled
      && config.authenticationEnabled
      && !userInfo;
  }
}
