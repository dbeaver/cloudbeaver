/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createSettingsGroup, FormFieldType, SettingsData } from '@cloudbeaver/core-settings';

export const AUTH_SETTINGS_GROUP = createSettingsGroup('settings_panel_authentication');

export const settings: SettingsData = {
  scopeType: 'core',
  scope: 'authentication',
  settingsData: [
    {
      key: 'disableAnonymousAccess',
      type: FormFieldType.Checkbox,
      name: 'settings_panel_authentication_disable_anonymous_access_name',
      description: 'settings_panel_authentication_disable_anonymous_access_description',
      groupId: AUTH_SETTINGS_GROUP.id,
    },
  ],
};
