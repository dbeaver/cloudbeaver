/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { SettingsMenuService, TopNavService } from '@dbeaver/core/app';
import { injectable } from '@dbeaver/core/di';
import { ServerService } from '@dbeaver/core/root';

import { AuthenticationService } from './AuthenticationService';
import { AuthInfoService } from './AuthInfoService';
import { AuthDialogService } from './Dialog/AuthDialogService';
import { UserInfo } from './UserInfo';

@injectable()
export class AuthMenuService {
  constructor(
    private serverService: ServerService,
    private authDialogService: AuthDialogService,
    private authInfoService: AuthInfoService,
    private settingsMenuService: SettingsMenuService,
    private authenticationService: AuthenticationService,
    private topNavService: TopNavService,
  ) { }

  register() {
    this.settingsMenuService.addMenuItem(
      SettingsMenuService.settingsMenuToken,
      {
        id: 'login',
        order: 0,
        isHidden: () => !this.serverService.config.data?.authenticationEnabled || !!this.authInfoService.userInfo,
        title: 'authentication_login',
        onClick: () => this.authDialogService.showLoginForm(),
      }
    );

    this.settingsMenuService.addMenuItem(
      SettingsMenuService.settingsMenuToken,
      {
        id: 'logout',
        order: Number.MAX_SAFE_INTEGER,
        isHidden: () => !this.serverService.config.data?.authenticationEnabled || !this.authInfoService.userInfo,
        title: 'authentication_logout',
        onClick: this.logout.bind(this),
      }
    );

    this.topNavService.placeholder.add(UserInfo, 4);
  }

  private async logout() {
    await this.authInfoService.logout();
    await this.authenticationService.auth();
  }
}
