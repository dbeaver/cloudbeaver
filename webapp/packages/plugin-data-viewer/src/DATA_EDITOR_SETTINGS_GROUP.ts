/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createSettingsGroup, FormFieldType, SettingsData } from '@cloudbeaver/core-settings';

export const DATA_EDITOR_SETTINGS_GROUP = createSettingsGroup('settings_data_editor');

export const settings: SettingsData = {
  scopeType: 'plugin',
  scope: 'data-viewer',
  settingsData: [
    {
      key: 'disableEdit',
      type: FormFieldType.Checkbox,
      name: 'settings_data_editor_disable_edit_name',
      description: 'settings_data_editor_disable_edit_description',
      groupId: DATA_EDITOR_SETTINGS_GROUP.id,
    },
    {
      key: 'fetchMin',
      type: FormFieldType.Input,
      name: 'settings_data_editor_fetch_min_name',
      description: 'settings_data_editor_fetch_min_description',
      groupId: DATA_EDITOR_SETTINGS_GROUP.id,
    },
    {
      key: 'fetchMax',
      type: FormFieldType.Input,
      name: 'settings_data_editor_fetch_max_name',
      description: 'settings_data_editor_fetch_max_description',
      groupId: DATA_EDITOR_SETTINGS_GROUP.id,
    },
    {
      key: 'fetchDefault',
      type: FormFieldType.Input,
      name: 'settings_data_editor_fetch_default_name',
      description: 'settings_data_editor_fetch_default_description',
      groupId: DATA_EDITOR_SETTINGS_GROUP.id,
    },
  ],
};
