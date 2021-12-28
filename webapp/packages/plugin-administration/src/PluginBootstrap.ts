/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { EAdminPermission, AdministrationScreenService } from '@cloudbeaver/core-administration';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { PermissionsService } from '@cloudbeaver/core-root';
import { ScreenService } from '@cloudbeaver/core-routing';
import { DATA_CONTEXT_MENU, MenuBaseItem, MenuService } from '@cloudbeaver/core-view';
import { TOP_NAV_BAR_SETTINGS_MENU } from '@cloudbeaver/plugin-settings-menu';

@injectable()
export class PluginBootstrap extends Bootstrap {
  constructor(
    private readonly permissionsService: PermissionsService,
    private readonly screenService: ScreenService,
    private readonly administrationScreenService: AdministrationScreenService,
    private readonly menuService: MenuService
  ) {
    super();
  }

  register(): void {
    this.menuService.addCreator({
      isApplicable: (context) => {
        if (context.get(DATA_CONTEXT_MENU) !== TOP_NAV_BAR_SETTINGS_MENU) {
          return false;
        }

        return this.permissionsService.has(EAdminPermission.admin) && !this.screenService.isActive(AdministrationScreenService.screenName);
      },
      getItems: (context, items) => {
        return [
          ...items,
          new MenuBaseItem(
            'administrationMenuEnter',
            'administration_menu_enter',
            'administration_menu_enter',
            { onSelect: () => this.administrationScreenService.navigateToRoot() }
          )
        ]
      },
      orderItems: (context, items) => {
        const index = items.findIndex(item => item.id === 'administrationMenuEnter');

        if (index > -1) {
          const item = items.splice(index, 1);
          items.unshift(item[0]);
        }

        return items;
      }
    });

    this.menuService.addCreator({
      isApplicable: (context) => {
        return context.get(DATA_CONTEXT_MENU) === TOP_NAV_BAR_SETTINGS_MENU && this.screenService.isActive(AdministrationScreenService.screenName);
      },
      getItems: (context, items) => {
        return [
          ...items,
          new MenuBaseItem(
            'administrationMenuBack',
            'administration_menu_back',
            'administration_menu_back',
            { onSelect: () => this.screenService.navigateToRoot() }
          )
        ]
      },
      orderItems: (context, items) => {
        const index = items.findIndex(item => item.id === 'administrationMenuBack');

        if (index > -1) {
          const item = items.splice(index, 1);
          items.unshift(item[0]);
        }

        return items;
      }
    });
  }

  load(): void { }
}
