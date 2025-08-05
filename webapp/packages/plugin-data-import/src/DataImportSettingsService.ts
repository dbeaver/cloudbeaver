/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { HIGHEST_SETTINGS_LAYER } from '@cloudbeaver/core-root';
import {
  createSettingsOverrideResolver,
  SettingsManagerService,
  SettingsProvider,
  SettingsProviderService,
  SettingsResolverService,
} from '@cloudbeaver/core-settings';
import { schema, schemaExtra } from '@cloudbeaver/core-utils';

const defaultSettings = schema.object({
  'plugin.data-import.disabled': schemaExtra.stringedBoolean().default(false),
});

export type DataImportSettings = schema.infer<typeof defaultSettings>;
export type DataImportSettingsSchema = typeof defaultSettings;

@injectable()
export class DataImportSettingsService {
  get disabled(): boolean {
    return this.settings.getValue('plugin.data-import.disabled');
  }

  readonly settings: SettingsProvider<typeof defaultSettings>;

  constructor(
    private readonly settingsProviderService: SettingsProviderService,
    private readonly settingsManagerService: SettingsManagerService,
    private readonly settingsResolverService: SettingsResolverService,
  ) {
    // Some settings registered in plugin-data-editor-public-settings & permissions
    this.settings = this.settingsProviderService.createSettings(defaultSettings);

    this.settingsResolverService.addResolver(
      HIGHEST_SETTINGS_LAYER,
      createSettingsOverrideResolver<DataImportSettingsSchema>(this.settingsResolverService, {
        'plugin.data-import.disabled': {
          key: 'permission.data-editor.import',
          map: value => !value,
        },
      }),
    );

    this.settingsManagerService.registerSettings<typeof defaultSettings>(() => []);
  }
}
