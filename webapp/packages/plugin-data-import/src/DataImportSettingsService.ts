/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { ESettingsValueType, SettingsManagerService, SettingsProvider, SettingsProviderService } from '@cloudbeaver/core-settings';
import { schema, schemaExtra } from '@cloudbeaver/core-utils';
import { DATA_EDITOR_SETTINGS_GROUP } from '@cloudbeaver/plugin-data-viewer';

const defaultSettings = schema.object({
  'plugin.data-import.disabled': schemaExtra.stringedBoolean().default(false),
});

export type DataImportSettings = schema.infer<typeof defaultSettings>;

@injectable()
export class DataImportSettingsService {
  get disabled(): boolean {
    return this.settings.getValue('plugin.data-import.disabled');
  }
  readonly settings: SettingsProvider<typeof defaultSettings>;

  constructor(
    private readonly settingsProviderService: SettingsProviderService,
    private readonly settingsManagerService: SettingsManagerService,
  ) {
    this.settings = this.settingsProviderService.createSettings(defaultSettings);

    this.settingsManagerService.registerSettings(this.settings, () => [
      {
        group: DATA_EDITOR_SETTINGS_GROUP,
        key: 'plugin.data-import.disabled',
        type: ESettingsValueType.Checkbox,
        name: 'plugin_data_import_disable_data_import_name',
        description: 'plugin_data_import_disable_data_import_description',
        access: {
          scope: ['server', 'role'],
        },
      },
    ]);
  }
}
