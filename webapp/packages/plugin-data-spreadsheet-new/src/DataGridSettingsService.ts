/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Dependency, injectable } from '@cloudbeaver/core-di';
import { ServerSettingsService } from '@cloudbeaver/core-root';
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
  hidden: schemaExtra.stringedBoolean().default(false),
});

export type DataGridSettings = schema.infer<typeof defaultSettings>;

@injectable()
export class DataGridSettingsService extends Dependency {
  readonly settings: SettingsProvider<typeof defaultSettings>;

  constructor(
    private readonly settingsProviderService: SettingsProviderService,
    private readonly settingsManagerService: SettingsManagerService,
    private readonly serverSettingsService: ServerSettingsService,
    private readonly settingsResolverService: SettingsResolverService,
  ) {
    super();
    this.settings = this.settingsProviderService.createSettings(defaultSettings, 'plugin', 'data-spreadsheet');
    this.settingsResolverService.addResolver(
      ROOT_SETTINGS_LAYER,
      /** @deprecated Use settings instead, will be removed in 23.0.0 */
      createSettingsAliasResolver(this.serverSettingsService, this.settings, 'plugin_data_spreadsheet_new'),
    );

    this.registerSettings();
  }

  private registerSettings() {
    this.settingsManagerService.registerSettings(this.settings.scope, this.settings.schema, () => [
      {
        group: DATA_EDITOR_SETTINGS_GROUP,
        key: 'hidden',
        access: {
          accessor: ['server'],
        },
        type: ESettingsValueType.Checkbox,
        name: 'plugin_data_spreadsheet_new_settings_disable',
      },
    ]);
  }
}
