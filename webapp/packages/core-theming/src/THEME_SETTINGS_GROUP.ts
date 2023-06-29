/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createSettingsGroup, FormFieldType, SettingsData } from '@cloudbeaver/core-settings';

import { themes } from './themes';

export const THEME_SETTINGS_GROUP = createSettingsGroup('settings_panel_theming');

export const settings: SettingsData = {
  scopeType: 'core',
  scope: 'theming',
  settingsData: [
    {
      key: 'defaultTheme',
      type: FormFieldType.Combobox,
      name: 'settings_panel_theming_default_theme_name',
      description: 'settings_panel_theming_default_theme_description',
      options: themes.map(theme => ({ id: theme.id, name: theme.name })),
      groupId: THEME_SETTINGS_GROUP.id,
    },
  ],
};
