/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { AuthInfoService } from '@cloudbeaver/core-authentication';
import { injectable, Bootstrap } from '@cloudbeaver/core-di';
import { ServerService, SessionService } from '@cloudbeaver/core-root';

import { AuthDialogService } from './Dialog/AuthDialogService';

@injectable()
export class AuthenticationService extends Bootstrap {
  private authenticating = false;
  constructor(
    private serverService: ServerService,
    private sessionService: SessionService,
    private authDialogService: AuthDialogService,
    private authInfoService: AuthInfoService,
  ) {
    super();
  }

  async auth() {
    if (this.authenticating) {
      return;
    }
    this.authenticating = true;
    try {
      const config = await this.serverService.config.load(null);
      if (!config) {
        throw new Error('Can\'t configure Authentication');
      }

      if (!config.authenticationEnabled || config.configurationMode) {
        return;
      }

      const userInfo = await this.authInfoService.updateAuthInfo();
      if (userInfo) {
        return;
      }

      if (!config.anonymousAccessEnabled) {
        await this.authDialogService.showLoginForm(true);
      }
    } finally {
      this.authenticating = false;
    }
  }

  register(): void | Promise<void> {
    this.serverService.config.onDataUpdate.subscribe(this.auth.bind(this));
    this.sessionService.session.onDataUpdate.subscribe(this.auth.bind(this));
  }

  load() { }
}
