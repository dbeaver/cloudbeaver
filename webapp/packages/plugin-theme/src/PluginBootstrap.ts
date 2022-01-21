/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { ThemeService } from '@cloudbeaver/core-theming';
import { DATA_CONTEXT_MENU, MenuBaseItem, MenuService } from '@cloudbeaver/core-view';
import { TOP_NAV_BAR_SETTINGS_MENU } from '@cloudbeaver/plugin-settings-menu';

import { THEME_MENU } from './THEME_MENU';

@injectable()
export class PluginBootstrap extends Bootstrap {
  constructor(
    private readonly menuService: MenuService,
    private readonly themeService: ThemeService
  ) {
    super();
  }

  register(): void | Promise<void> {
    this.menuService.addCreator({
      isApplicable: context => (
        context.get(DATA_CONTEXT_MENU) === TOP_NAV_BAR_SETTINGS_MENU 
        && this.themeService.themes.length > 0
      ),
      getItems(context, items) {
        return [
          ...items,
          THEME_MENU,
        ];
      },
    });

    this.menuService.addCreator({
      isApplicable(context) {
        return context.get(DATA_CONTEXT_MENU) === THEME_MENU;
      },
      getItems: (context, items) => {
        const themes = this.themeService.themes.map(theme => new MenuBaseItem(
          {
            id: theme.id,
            label: theme.name,
            tooltip: theme.name,
          },
          {
            onSelect: () => this.themeService.changeTheme(theme.id),
          },
          {
            isDisabled: () => this.themeService.currentThemeId === theme.id,
          }
        ));

        return [
          ...items,
          ...themes,
        ];
      },
    });
  }

  load(): void | Promise<void> { }
}