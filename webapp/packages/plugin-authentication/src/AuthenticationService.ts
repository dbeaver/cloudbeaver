/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { AuthInfoService } from '@cloudbeaver/core-authentication';
import { injectable, Bootstrap } from '@cloudbeaver/core-di';
import { ServerService } from '@cloudbeaver/core-root';

import { AuthDialogService } from './Dialog/AuthDialogService';

@injectable()
export class AuthenticationService extends Bootstrap {
  constructor(
    private serverService: ServerService,
    private authDialogService: AuthDialogService,
    private authInfoService: AuthInfoService,
  ) {
    super();
  }

  async auth() {
    const config = await this.serverService.config.load(null);
    if (!config) {
      throw new Error('Can\'t configure Authentication');
    }

    if (!config.authenticationEnabled) {
      return;
    }

    const userInfo = await this.authInfoService.updateAuthInfo();
    if (userInfo) {
      return;
    }

    if (!config.anonymousAccessEnabled) {
      await this.authDialogService.showLoginForm(true);
    }
  }

  register(): void | Promise<void> { }

  load() {
    // we do not await it because to unblock app loading
    this.auth();
  }
}
