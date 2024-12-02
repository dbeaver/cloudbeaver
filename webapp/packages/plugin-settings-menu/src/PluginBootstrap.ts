/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { menuExtractItems, MenuService } from '@cloudbeaver/core-view';
import { MENU_APP_STATE } from '@cloudbeaver/plugin-top-app-bar';

import { TOP_NAV_BAR_SETTINGS_MENU } from './SettingsMenu/TOP_NAV_BAR_SETTINGS_MENU.js';

@injectable()
export class PluginBootstrap extends Bootstrap {
  constructor(private readonly menuService: MenuService) {
    super();
  }

  override register(): void {
    this.addTopAppMenuItems();
  }

  private addTopAppMenuItems() {
    this.menuService.addCreator({
      menus: [MENU_APP_STATE],
      getItems: (context, items) => [...items, TOP_NAV_BAR_SETTINGS_MENU],
      orderItems: (context, items) => {
        const extracted = menuExtractItems(items, [TOP_NAV_BAR_SETTINGS_MENU]);

        return [...items, ...extracted];
      },
    });
  }
}
