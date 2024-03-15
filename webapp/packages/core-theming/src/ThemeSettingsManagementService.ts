/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Dependency, injectable } from '@cloudbeaver/core-di';
import { ESettingsValueType, INTERFACE_SETTINGS_GROUP, SettingsManagerService } from '@cloudbeaver/core-settings';

import { ThemeService } from './ThemeService';
import { ThemeSettingsService } from './ThemeSettingsService';

@injectable()
export class ThemeSettingsManagementService extends Dependency {
  constructor(themeSettingsService: ThemeSettingsService, themeService: ThemeService, settingsManagerService: SettingsManagerService) {
    super();
    settingsManagerService.registerSettings(themeSettingsService.settings, () => [
      {
        key: 'theme',
        access: {
          accessor: ['server', 'client'],
        },
        type: ESettingsValueType.Select,
        name: 'core_theming_settings_theme_name',
        description: 'core_theming_settings_theme_description',
        options: themeService.themes.map(theme => ({ id: theme.id, name: theme.name })),
        group: INTERFACE_SETTINGS_GROUP,
      },
    ]);
  }
}
