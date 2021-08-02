/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { AuthInfoService, AUTH_PROVIDER_LOCAL_ID } from '@cloudbeaver/core-authentication';
import { injectable } from '@cloudbeaver/core-di';
import { CommonDialogService, IComputedMenuItemOptions, IMenuPanel, StaticMenu } from '@cloudbeaver/core-dialogs';

import { ChangeUserPasswordDialog } from './ChangeUserPasswordDialog/ChangeUserPasswordDialog';

@injectable()
export class UserMenuService {
  static userMenuToken = 'userMenu';

  private menu = new StaticMenu();

  getUserMenuToken() {
    return UserMenuService.userMenuToken;
  }

  constructor(
    private authInfoService: AuthInfoService,
    private commonDialogService: CommonDialogService,
  ) { }

  register(): void {
    this.menu.addRootPanel(this.getUserMenuToken());
    this.addMenuItem(
      this.getUserMenuToken(),
      {
        id: 'changePassword',
        order: 0,
        isHidden: () => !this.authInfoService.userInfo?.linkedAuthProviders.includes(AUTH_PROVIDER_LOCAL_ID),
        title: 'authentication_user_password_change_menu_title',
        onClick: async () => {
          await this.commonDialogService.open(ChangeUserPasswordDialog, null);
        },
      }
    );
  }

  getMenu(): IMenuPanel {
    return this.menu.getMenu(this.getUserMenuToken());
  }

  addMenuItem(panelId: string, options: IComputedMenuItemOptions): void {
    this.menu.addMenuItem(panelId, options);
  }
}
