/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { UserInfoResource } from '@cloudbeaver/core-authentication';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import { MenuBaseItem, menuExtractItems, MenuService } from '@cloudbeaver/core-view';
import { TOP_NAV_BAR_SETTINGS_MENU } from '@cloudbeaver/plugin-settings-menu';

import { AuthenticationService } from './AuthenticationService.js';

@injectable(() => [ServerConfigResource, AuthenticationService, UserInfoResource, MenuService])
export class PluginBootstrap extends Bootstrap {
  constructor(
    private readonly serverConfigResource: ServerConfigResource,
    private readonly authenticationService: AuthenticationService,
    private readonly userInfoResource: UserInfoResource,
    private readonly menuService: MenuService,
  ) {
    super();
  }

  override register(): void {
    const LOGIN_ITEM = new MenuBaseItem(
      {
        id: 'login',
        label: 'authentication_login',
        tooltip: 'authentication_login',
      },
      { onSelect: () => this.authenticationService.authUser(null, false) },
    );
    const LOGOUT_ITEM = new MenuBaseItem(
      {
        id: 'logout',
        label: 'authentication_logout',
        tooltip: 'authentication_logout',
      },
      { onSelect: () => this.authenticationService.logout() },
    );
    this.menuService.addCreator({
      menus: [TOP_NAV_BAR_SETTINGS_MENU],
      getItems: (context, items) => {
        if (this.serverConfigResource.enabledAuthProviders.length > 0 && this.userInfoResource.isAnonymous()) {
          return [...items, LOGIN_ITEM];
        }

        if (this.userInfoResource.isAuthenticated()) {
          return [...items, LOGOUT_ITEM];
        }

        return items;
      },
      orderItems: (context, items) => {
        items.push(...menuExtractItems(items, [LOGIN_ITEM, LOGOUT_ITEM]));
        return items;
      },
    });
  }
}
