/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { RESOURCE_MANAGER_SETTINGS_GROUP } from '@cloudbeaver/core-resource-manager';
import { ESettingsValueType, SettingsManagerService, SettingsProvider, SettingsProviderService } from '@cloudbeaver/core-settings';
import { schema, schemaExtra } from '@cloudbeaver/core-utils';

const settingsSchema = schema.object({
  'plugin.resource-manager-scripts.disabled': schemaExtra.stringedBoolean().default(false),
});

type Settings = typeof settingsSchema;

@injectable(() => [SettingsProviderService, SettingsManagerService])
export class ResourceManagerScriptsSettingsService {
  readonly settings: SettingsProvider<Settings>;

  get disabled(): boolean {
    return this.settings.getValue('plugin.resource-manager-scripts.disabled');
  }

  constructor(
    private readonly settingsProviderService: SettingsProviderService,
    private readonly settingsManagerService: SettingsManagerService,
  ) {
    this.settings = this.settingsProviderService.createSettings(settingsSchema);

    this.registerSettings();
  }

  private registerSettings() {
    this.settingsManagerService.registerSettings<Settings>(() => [
      {
        group: RESOURCE_MANAGER_SETTINGS_GROUP,
        key: 'plugin.resource-manager-scripts.disabled',
        access: {
          scope: ['role'],
        },
        type: ESettingsValueType.Checkbox,
        name: 'plugin_resource_manager_scripts_disable',
        description: 'plugin_resource_manager_scripts_disable_description',
      },
    ]);
  }
}
