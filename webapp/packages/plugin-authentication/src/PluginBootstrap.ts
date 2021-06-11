/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { AdministrationTopAppBarService } from '@cloudbeaver/core-administration';
import { SettingsMenuService, TopNavService } from '@cloudbeaver/core-app';
import { AuthInfoService } from '@cloudbeaver/core-authentication';
import { injectable, Bootstrap } from '@cloudbeaver/core-di';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import { ServerConfigurationService } from '@cloudbeaver/plugin-administration';

import { AuthenticationProviders } from './Administration/ServerConfiguration/AuthenticationProviders';
import { AuthenticationService } from './AuthenticationService';
import { AuthDialogService } from './Dialog/AuthDialogService';
import { UserInfo } from './UserInfo';
import { UserMenuService } from './UserMenu/UserMenuService';

@injectable()
export class PluginBootstrap extends Bootstrap {
  constructor(
    private serverConfigResource: ServerConfigResource,
    private authDialogService: AuthDialogService,
    private authenticationService: AuthenticationService,
    private authInfoService: AuthInfoService,
    private settingsMenuService: SettingsMenuService,
    private topNavService: TopNavService,
    private administrationTopAppBarService: AdministrationTopAppBarService,
    private userMenuService: UserMenuService,
    private readonly serverConfigurationService: ServerConfigurationService
  ) {
    super();
  }

  register(): void {
    this.settingsMenuService.addMenuItem(
      SettingsMenuService.settingsMenuToken,
      {
        id: 'login',
        order: 0,
        isHidden: () => this.serverConfigResource.enabledAuthProviders.length === 0 || !!this.authInfoService.userInfo,
        title: 'authentication_login',
        onClick: () => this.authDialogService.showLoginForm(false, null, true),
      }
    );

    this.settingsMenuService.addMenuItem(
      SettingsMenuService.settingsMenuToken,
      {
        id: 'logout',
        order: Number.MAX_SAFE_INTEGER,
        isHidden: () => !this.authInfoService.userInfo,
        title: 'authentication_logout',
        onClick: this.authenticationService.logout.bind(this.authenticationService),
      }
    );
    this.userMenuService.register();
    this.topNavService.placeholder.add(UserInfo, 4);
    this.administrationTopAppBarService.placeholder.add(UserInfo, 4);
    this.serverConfigurationService.configurationContainer.add(AuthenticationProviders, 0);
  }

  load(): void | Promise<void> { }
}
