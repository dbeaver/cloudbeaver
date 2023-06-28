/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createSettingsGroup, FormFieldType, type SettingsData } from '@cloudbeaver/core-settings';

export const CONNECTIONS_SETTINGS_GROUP = createSettingsGroup('Connections');

export const settings: SettingsData = {
  scopeType: 'plugin',
  scope: 'connections',
  settingsData: [
    {
      key: 'hideConnectionViewForUsers',
      type: FormFieldType.Checkbox,
      name: 'Show connections to admins only',
      description: 'Show connections to admins only',
      groupId: CONNECTIONS_SETTINGS_GROUP.id,
    },
  ],
};
