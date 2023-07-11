/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createSettingsGroup, type SettingsData } from '@cloudbeaver/core-settings';

export const CONNECTIONS_SETTINGS_GROUP = createSettingsGroup('settings_connections');

export const settings: SettingsData = {
  scopeType: 'plugin',
  scope: 'connections',
  settingsData: [
    // TODO: it's administrator settings
    // {
    //   key: 'hideConnectionViewForUsers',
    //   type: FormFieldType.Checkbox,
    //   name: 'settings_connections_hide_connections_view_name',
    //   description: 'settings_connections_hide_connections_view_description',
    //   groupId: CONNECTIONS_SETTINGS_GROUP.id,
    // },
  ],
};
