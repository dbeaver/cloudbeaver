/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { LocalizationService } from '@cloudbeaver/core-localization';
import { ThemeService } from '@cloudbeaver/core-theming';

import { UserInfoResource } from './UserInfoResource';

const USER_APP_THEME = 'app.theme';
const USER_APP_LANGUAGE = 'app.language';

@injectable()
export class UserConfigurationBootstrap extends Bootstrap {

  constructor(
    private readonly userInfoResource: UserInfoResource,
    private readonly themeService: ThemeService,
    private readonly localizationService: LocalizationService,
  ) {
    super();
    this.userInfoResource.onDataUpdate.addHandler(() => {
      const theme = this.userInfoResource.getConfigurationParameter(USER_APP_THEME);

      if (typeof theme === 'string') {
        this.themeService.setTheme(theme);
      }

      const language = this.userInfoResource.getConfigurationParameter(USER_APP_LANGUAGE);

      if (typeof language === 'string') {
        this.localizationService.setLocale(language);
      }
    });

    this.themeService.onChange.addHandler(async theme => {
      const currentTheme = this.userInfoResource.getConfigurationParameter(USER_APP_THEME);

      if (currentTheme !== theme.id) {
        await this.userInfoResource.setConfigurationParameter(USER_APP_THEME, theme.id);
      }
    });

    this.localizationService.onChange.addHandler(async locale => {
      const currentLocale = this.userInfoResource.getConfigurationParameter(USER_APP_LANGUAGE);

      if (currentLocale !== locale) {
        await this.userInfoResource.setConfigurationParameter(USER_APP_LANGUAGE, locale);
      }
    });
  }

  register(): void {  }

  async load(): Promise<void> {
    await this.userInfoResource.load();
  }

}