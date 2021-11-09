/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { IComputedMenuItemOptions, IMenuPanel, StaticMenu } from '@cloudbeaver/core-dialogs';
import { LocalizationService } from '@cloudbeaver/core-localization';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import { ThemeService } from '@cloudbeaver/core-theming';

@injectable()
export class SettingsMenuService extends Bootstrap {
  static settingsMenuToken = 'settingsMenu';

  private menu = new StaticMenu();
  private langMenuToken = 'langMenu';
  private themeMenuToken = 'themeMenu';

  constructor(
    private localizationService: LocalizationService,
    private themeService: ThemeService,
    private serverConfigResource: ServerConfigResource,
  ) {
    super();
  }

  register(): void | Promise<void> {
    this.menu.addRootPanel(SettingsMenuService.settingsMenuToken);
  }

  async load(): Promise<void> {
    this.addThemes();
    await this.addLocales();
  }

  getMenu(): IMenuPanel {
    return this.menu.getMenu(SettingsMenuService.settingsMenuToken);
  }

  addMenuItem(panelId: string, options: IComputedMenuItemOptions): void {
    this.menu.addMenuItem(panelId, options);
  }

  private addThemes() {
    this.addMenuItem(
      SettingsMenuService.settingsMenuToken,
      {
        id: this.themeMenuToken,
        order: 1,
        title: 'app_shared_settingsMenu_theme',
        isPanel: true,
      }
    );

    this.themeService.themes.forEach(theme => {
      this.addMenuItem(
        this.themeMenuToken,
        {
          id: theme.id,
          title: theme.name,
          isDisabled: () => theme.id === this.themeService.currentThemeId,
          onClick: () => this.themeService.changeThemeAsync(theme.id),
        }
      );
    });
  }

  private async addLocales() {
    const config = await this.serverConfigResource.load();

    if (!config) {
      return;
    }

    this.addMenuItem(
      SettingsMenuService.settingsMenuToken,
      {
        id: this.langMenuToken,
        order: 2,
        title: 'app_shared_settingsMenu_lang',
        isPanel: true,
      }
    );

    config.supportedLanguages.forEach(lang => {
      this.addMenuItem(
        this.langMenuToken,
        {
          id: lang.isoCode,
          title: lang.nativeName,
          isDisabled: () => lang.isoCode === this.localizationService.getCurrentLanguage(),
          onClick: () => this.localizationService.changeLocaleAsync(lang.isoCode),
        }
      );
    });
  }
}
