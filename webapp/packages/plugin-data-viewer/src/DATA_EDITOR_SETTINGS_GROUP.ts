/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createSettingsGroup, FormFieldType, SettingsData } from '@cloudbeaver/core-settings';

export const DATA_EDITOR_SETTINGS_GROUP = createSettingsGroup('Data Editor');

export const settings: SettingsData = {
  scopeType: 'plugin',
  scope: 'data-viewer',
  settingsData: [
    {
      key: 'disableEdit',
      type: FormFieldType.Checkbox,
      name: 'Disable Edit',
      description: 'Disable edit',
      groupId: DATA_EDITOR_SETTINGS_GROUP.id,
    },
    {
      key: 'fetchMin',
      type: FormFieldType.Input,
      name: 'Fetch Min',
      description: 'Minimum number of rows to fetch',
      groupId: DATA_EDITOR_SETTINGS_GROUP.id,
    },
    {
      key: 'fetchMax',
      type: FormFieldType.Input,
      name: 'Fetch Max',
      description: 'Maximum number of rows to fetch',
      groupId: DATA_EDITOR_SETTINGS_GROUP.id,
    },
    {
      key: 'fetchDefault',
      type: FormFieldType.Input,
      name: 'Fetch Default',
      description: 'Default number of rows to fetch',
      groupId: DATA_EDITOR_SETTINGS_GROUP.id,
    },
  ],
};
