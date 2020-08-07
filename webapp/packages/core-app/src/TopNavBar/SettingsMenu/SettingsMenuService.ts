/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { EAdminPermission, AdministrationScreenService } from '@cloudbeaver/core-administration';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { IComputedMenuItemOptions, StaticMenu } from '@cloudbeaver/core-dialogs';
import { LocalizationService } from '@cloudbeaver/core-localization';
import { ServerConfigResource, PermissionsService } from '@cloudbeaver/core-root';
import { ScreenService } from '@cloudbeaver/core-routing';
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
    private permissionsService: PermissionsService,
    private serverConfigResource: ServerConfigResource,
    private screenService: ScreenService,
    private administrationScreenService: AdministrationScreenService
  ) {
    super();
  }

  register(): void | Promise<void> {
    this.menu.addRootPanel(SettingsMenuService.settingsMenuToken);
  }

  async load(): Promise<void> {
    this.addAdministration();
    this.addThemes();
    await this.addLocales();
  }

  getMenu() {
    return this.menu.getMenu(SettingsMenuService.settingsMenuToken);
  }

  addMenuItem(panelId: string, options: IComputedMenuItemOptions) {
    this.menu.addMenuItem(panelId, options);
  }

  private addAdministration() {
    this.addMenuItem(
      SettingsMenuService.settingsMenuToken,
      {
        id: 'administrationMenuEnter',
        order: 0,
        isHidden: () => !this.permissionsService.has(EAdminPermission.admin)
          || this.screenService.isActive(AdministrationScreenService.screenName),
        title: 'administration_menu_enter',
        onClick: () => this.administrationScreenService.navigateToRoot(),
      }
    );
    this.addMenuItem(
      SettingsMenuService.settingsMenuToken,
      {
        id: 'administrationMenuBack',
        order: 0,
        isHidden: () => !this.screenService.isActive(AdministrationScreenService.screenName),
        title: 'administration_menu_back',
        onClick: () => this.screenService.navigateToRoot(),
      }
    );
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

  private async addLocales() {
    const config = await this.serverConfigResource.load(null);

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

    config.supportedLanguages.forEach((lang) => {
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
