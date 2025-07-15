/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Dependency, injectable } from '@cloudbeaver/core-di';
import {
  createSettingsAliasResolver,
  ESettingsValueType,
  ROOT_SETTINGS_LAYER,
  SettingsManagerService,
  SettingsProvider,
  SettingsProviderService,
  SettingsResolverService,
} from '@cloudbeaver/core-settings';
import { schema, schemaExtra } from '@cloudbeaver/core-utils';
import { DATA_EDITOR_SETTINGS_GROUP } from '@cloudbeaver/plugin-data-viewer';

const defaultSettings = schema.object({
  'plugin.data-spreadsheet.hidden': schemaExtra.stringedBoolean().default(false),
  'plugin.data-spreadsheet.showDescriptionInHeader': schemaExtra.stringedBoolean().default(true),
});

export type DataGridSettings = schema.infer<typeof defaultSettings>;

@injectable()
export class DataGridSettingsService extends Dependency {
  get hidden(): boolean {
    return this.settings.getValue('plugin.data-spreadsheet.hidden');
  }

  get description(): boolean {
    return this.settings.getValue('plugin.data-spreadsheet.showDescriptionInHeader');
  }

  readonly settings: SettingsProvider<typeof defaultSettings>;

  constructor(
    private readonly settingsProviderService: SettingsProviderService,
    private readonly settingsManagerService: SettingsManagerService,
    private readonly settingsResolverService: SettingsResolverService,
  ) {
    super();
    this.settings = this.settingsProviderService.createSettings(defaultSettings);
    this.settingsResolverService.addResolver(
      ROOT_SETTINGS_LAYER,
      /** @deprecated Use settings instead, will be removed in 23.0.0 */
      createSettingsAliasResolver(this.settingsResolverService, this.settings, {
        'plugin.data-spreadsheet.hidden': 'plugin_data_spreadsheet_new.hidden',
      }),
    );

    this.registerSettings();
  }

  private registerSettings() {
    this.settingsManagerService.registerSettings(this.settings, () => [
      {
        group: DATA_EDITOR_SETTINGS_GROUP,
        key: 'plugin.data-spreadsheet.hidden',
        access: {
          scope: ['role'],
        },
        type: ESettingsValueType.Checkbox,
        name: 'plugin_data_spreadsheet_new_settings_disable',
        description: 'plugin_data_spreadsheet_new_settings_disable_description',
      },
      {
        group: DATA_EDITOR_SETTINGS_GROUP,
        key: 'plugin.data-spreadsheet.showDescriptionInHeader',
        access: {
          scope: ['client'],
        },
        type: ESettingsValueType.Checkbox,
        name: 'plugin_data_spreadsheet_new_settings_description_label',
        description: 'plugin_data_spreadsheet_new_settings_description_label_description',
      },
    ]);
  }
}
