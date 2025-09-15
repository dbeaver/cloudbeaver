/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { lazy } from 'react';

import { AdministrationScreenService } from '@cloudbeaver/core-administration';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { EAdminPermission, PermissionsService } from '@cloudbeaver/core-root';
import { ScreenService } from '@cloudbeaver/core-routing';
import { MenuBaseItem, menuExtractItems, MenuService } from '@cloudbeaver/core-view';
import { TOP_NAV_BAR_SETTINGS_MENU } from '@cloudbeaver/plugin-settings-menu';

import { AdministrationTopAppBarService } from './AdministrationScreen/AdministrationTopAppBar/AdministrationTopAppBarService.js';

const AdministrationMenu = lazy(() => import('./AdministrationMenu/AdministrationMenu.js').then(m => ({ default: m.AdministrationMenu })));
const AppStateMenu = lazy(() => import('@cloudbeaver/plugin-top-app-bar').then(m => ({ default: m.AppStateMenu })));

@injectable(() => [PermissionsService, ScreenService, AdministrationScreenService, AdministrationTopAppBarService, MenuService])
export class PluginBootstrap extends Bootstrap {
  constructor(
    private readonly permissionsService: PermissionsService,
    private readonly screenService: ScreenService,
    private readonly administrationScreenService: AdministrationScreenService,
    private readonly administrationTopAppBarService: AdministrationTopAppBarService,
    private readonly menuService: MenuService,
  ) {
    super();
  }

  override register(): void {
    this.administrationTopAppBarService.placeholder.add(AdministrationMenu, 0);
    this.administrationTopAppBarService.placeholder.add(AppStateMenu);

    const ADMINISTRATION_MENU_OPEN = new MenuBaseItem(
      {
        id: 'administrationMenuEnter',
        label: 'administration_menu_enter',
        tooltip: 'administration_menu_enter',
      },
      { onSelect: () => this.administrationScreenService.navigateToRoot() },
    );

    const ADMINISTRATION_MENU_BACK = new MenuBaseItem(
      {
        id: 'administrationMenuBack',
        label: 'administration_menu_back',
        tooltip: 'administration_menu_back',
      },
      { onSelect: () => this.screenService.navigateToRoot() },
    );

    this.menuService.addCreator({
      menus: [TOP_NAV_BAR_SETTINGS_MENU],
      getItems: (context, items) => {
        const administrationScreen = this.screenService.isActive(AdministrationScreenService.screenName);

        if (this.permissionsService.has(EAdminPermission.admin) && !administrationScreen) {
          return [...items, ADMINISTRATION_MENU_OPEN];
        }

        if (administrationScreen) {
          return [...items, ADMINISTRATION_MENU_BACK];
        }

        return items;
      },
      orderItems: (context, items) => {
        items.unshift(...menuExtractItems(items, [ADMINISTRATION_MENU_OPEN, ADMINISTRATION_MENU_BACK]));
        return items;
      },
    });
  }
}
