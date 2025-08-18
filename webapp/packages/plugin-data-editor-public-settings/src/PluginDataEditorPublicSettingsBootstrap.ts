/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ESettingsValueType, SettingsManagerService } from '@cloudbeaver/core-settings';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { DATA_EDITOR_SETTINGS_GROUP, type DataViewerSettingsSchema } from '@cloudbeaver/plugin-data-viewer';
import type { DataImportSettingsSchema } from '@cloudbeaver/plugin-data-import';

@injectable()
export class PluginDataEditorPublicSettingsBootstrap extends Bootstrap {
  constructor(private readonly settingsManagerService: SettingsManagerService) {
    super();
  }

  override register(): void {
    this.settingsManagerService.registerSettings<DataViewerSettingsSchema>(() => [
      {
        key: 'plugin.data-viewer.disableEdit',
        access: {
          scope: ['server', 'role'],
        },
        type: ESettingsValueType.Checkbox,
        name: 'data_editor_public_settings_disable_edit_name',
        description: 'data_editor_public_settings_disable_edit_description',
        group: DATA_EDITOR_SETTINGS_GROUP,
      },
      {
        key: 'plugin.data-viewer.disableCopyData',
        access: {
          scope: ['server', 'role'],
        },
        type: ESettingsValueType.Checkbox,
        name: 'data_editor_public_settings_disable_data_copy_name',
        description: 'data_editor_public_settings_disable_data_copy_description',
        group: DATA_EDITOR_SETTINGS_GROUP,
      },
      {
        group: DATA_EDITOR_SETTINGS_GROUP,
        key: 'plugin.data-viewer.export.disabled',
        type: ESettingsValueType.Checkbox,
        name: 'data_editor_public_settings_disable_data_export_name',
        description: 'data_editor_public_settings_disable_data_export_description',
        access: {
          scope: ['server', 'role'],
        },
      },
    ]);

    this.settingsManagerService.registerSettings<DataImportSettingsSchema>(() => [
      {
        group: DATA_EDITOR_SETTINGS_GROUP,
        key: 'plugin.data-import.disabled',
        type: ESettingsValueType.Checkbox,
        name: 'data_editor_public_settings_disable_data_import_name',
        description: 'data_editor_public_settings_disable_data_import_description',
        access: {
          scope: ['server', 'role'],
        },
      },
    ]);
  }
}
