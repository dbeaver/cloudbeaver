/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { LocalizationService } from '@cloudbeaver/core-localization';
import { ESettingsValueType, INTERFACE_SETTINGS_GROUP, SettingsManagerService } from '@cloudbeaver/core-plugin';

import { SettingsLocalizationService } from './SettingsLocalizationService';

@injectable()
export class LocalizationSettingsManagerService extends Bootstrap {
  constructor(
    private readonly localizationService: LocalizationService,
    private readonly settingsLocalizationService: SettingsLocalizationService,
    private readonly settingsManagerService: SettingsManagerService,
  ) {
    super();
  }

  register(): void {
    this.registerSettings();
  }

  private registerSettings() {
    this.settingsManagerService.registerSettings(this.settingsLocalizationService.pluginSettings, () => [
      {
        group: INTERFACE_SETTINGS_GROUP,
        key: 'defaultLanguage',
        name: 'core_settings_localization_settings_default_locale_label',
        description: 'core_settings_localization_settings_default_locale_description',
        type: ESettingsValueType.Select,
        options: this.localizationService.supportedLanguages.map(language => ({
          id: language.isoCode,
          name: language.displayName,
        })),
      },
    ]);
  }
}
