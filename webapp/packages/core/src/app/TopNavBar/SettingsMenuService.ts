/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@dbeaver/core/di';
import { IComputedMenuItemOptions } from '@dbeaver/core/dialogs';
import { LocalizationService } from '@dbeaver/core/localization';
import { ThemeService } from '@dbeaver/core/theming';

import { MainRightMenuService } from './MainRightMenu/MainRightMenuService';

@injectable()
export class SettingsMenuService {
  static settingsMenuToken = 'settingsMenu';

  private langMenuToken = 'langMenu';
  private themeMenuToken = 'themeMenu';

  constructor(
    private localizationService: LocalizationService,
    private themeService: ThemeService,
    private mainRightMenuService: MainRightMenuService,
  ) {

    this.addSettingsItem();
    this.addThemes();
    this.addLocales();
  }

  addMenuItem(panelId: string, options: IComputedMenuItemOptions) {
    this.mainRightMenuService.registerMenuItem(panelId, options);
  }

  private addSettingsItem() {
    this.mainRightMenuService.registerRootItem({
      id: SettingsMenuService.settingsMenuToken,
      order: 1,
      icon: 'settings',
      isPanel: true,
    });
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

    this.themeService.themes.forEach((theme) => {
      this.addMenuItem(
        this.themeMenuToken,
        {
          id: theme.id,
          title: theme.name,
          isDisabled: () => theme.id === this.themeService.currentThemeId,
          onClick: () => this.themeService.changeThemeAsync(theme.id),
        },
      );
    });
  }

  private addLocales() {
    this.addMenuItem(
      SettingsMenuService.settingsMenuToken,
      {
        id: this.langMenuToken,
        order: 2,
        title: 'app_shared_settingsMenu_lang',
        isPanel: true,
      }
    );

    this.localizationService.getSupportedLanguages().forEach((lang) => {
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
