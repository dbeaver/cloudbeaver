/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { AuthInfoService } from '@cloudbeaver/core-authentication';
import { injectable, Bootstrap } from '@cloudbeaver/core-di';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import { DATA_CONTEXT_MENU, MenuBaseItem, MenuService } from '@cloudbeaver/core-view';
import { TOP_NAV_BAR_SETTINGS_MENU } from '@cloudbeaver/plugin-settings-menu';

import { AuthenticationService } from './AuthenticationService';
import { AuthDialogService } from './Dialog/AuthDialogService';

@injectable()
export class PluginBootstrap extends Bootstrap {
  constructor(
    private readonly serverConfigResource: ServerConfigResource,
    private readonly authDialogService: AuthDialogService,
    private readonly authenticationService: AuthenticationService,
    private readonly authInfoService: AuthInfoService,
    private readonly menuService: MenuService,
  ) {
    super();
  }

  register(): void {
    this.menuService.addCreator({
      isApplicable: context => context.get(DATA_CONTEXT_MENU) === TOP_NAV_BAR_SETTINGS_MENU,
      getItems: (context, items) => {
        if (this.serverConfigResource.enabledAuthProviders.length > 0 && !this.authInfoService.userInfo) {
          return [
            ...items,
            new MenuBaseItem(
              {
                id: 'login',
                label: 'authentication_login',
                tooltip: 'authentication_login',
              },
              { onSelect: () => this.authDialogService.showLoginForm(false, null, true) }
            ),
          ];
        }

        if (this.authInfoService.userInfo) {
          return [
            ...items,
            new MenuBaseItem(
              {
                id: 'logout',
                label: 'authentication_logout',
                tooltip: 'authentication_logout',
              },
              { onSelect: this.authenticationService.logout.bind(this.authenticationService) }
            ),
          ];
        }

        return items;
      },
      orderItems: (context, items) => {
        const index = items.findIndex(item => item.id === 'logout' || item.id === 'login');

        if (index > -1) {
          const item = items.splice(index, 1);
          items.push(item[0]);
        }

        return items;
      },
    });
  }

  load(): void | Promise<void> { }
}
