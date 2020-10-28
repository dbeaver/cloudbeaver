/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { AdministrationScreenService } from '@cloudbeaver/core-administration';
import { AppScreenService } from '@cloudbeaver/core-app';
import { UserInfoResource } from '@cloudbeaver/core-authentication';
import { injectable, Bootstrap } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { ServerService, SessionService } from '@cloudbeaver/core-root';
import { ScreenService } from '@cloudbeaver/core-routing';

import { AuthDialogService } from './Dialog/AuthDialogService';

@injectable()
export class AuthenticationService extends Bootstrap {
  private authPromise: Promise<void> | null;
  constructor(
    private screenService: ScreenService,
    private appScreenService: AppScreenService,
    private serverService: ServerService,
    private sessionService: SessionService,
    private authDialogService: AuthDialogService,
    private userInfoResource: UserInfoResource,
    private notificationService: NotificationService,
    private readonly administrationScreenService: AdministrationScreenService
  ) {
    super();
    this.authPromise = null;
  }

  async authUser(provider: string | null = null): Promise<void> {
    await this.auth(false, provider);
  }

  async logout(): Promise<void> {
    try {
      await this.userInfoResource.logout();

      if (!this.administrationScreenService.isConfigurationMode) {
        this.screenService.navigateToRoot();
      }
    } catch (exception) {
      this.notificationService.logException(exception, 'Can\'t logout');
    }
  }

  private async auth(persistent: boolean, provider: string | null = null) {
    if (this.authPromise) {
      return this.authPromise;
    }
    this.authPromise = this.wrap(persistent, provider);
    try {
      await this.authPromise;
    } finally {
      this.authPromise = null;
    }
  }

  private async wrap(persistent: boolean, provider: string | null = null) {
    const userInfo = await this.userInfoResource.load();
    if (userInfo) {
      return;
    }

    await this.authDialogService.showLoginForm(persistent, provider);
  }

  private async requireAuthentication() {
    const config = await this.serverService.config.load(null);
    if (!config) {
      throw new Error('Can\'t configure Authentication');
    }

    if (config.anonymousAccessEnabled || !config.authenticationEnabled) {
      return;
    }

    await this.auth(true);
  }

  register(): void | Promise<void> {
    this.sessionService.session.onDataUpdate.subscribe(() => this.requireAuthentication());
    this.appScreenService.activation.addHandler(() => this.requireAuthentication());
    this.administrationScreenService.ensurePermissions.addHandler(async () => await this.auth(false));
  }

  load() { }
}
