/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Dependency, injectable } from '@cloudbeaver/core-di';
import { PluginManagerService, PluginSettings, SettingsManagerService } from '@cloudbeaver/core-plugin';
import { schema } from '@cloudbeaver/core-utils';

const settingsSchema = schema.object({
  disabled: schema.coerce.boolean().default(false),
});

type Settings = typeof settingsSchema;

@injectable()
export class ResourceManagerScriptsSettingsService extends Dependency {
  readonly settings: PluginSettings<Settings>;

  constructor(private readonly pluginManagerService: PluginManagerService, private readonly settingsManagerService: SettingsManagerService) {
    super();
    this.settings = this.pluginManagerService.createSettings('resource-manager-scripts', 'plugin', settingsSchema);

    this.registerSettings();
  }

  private registerSettings() {
    this.settingsManagerService.registerSettings(this.settings, () => [
      // {
      //   group: RESOURCE_MANAGER_SETTINGS_GROUP,
      //   key: 'disabled',
      //   type: ESettingsValueType.Checkbox,
      //   name: 'Disable resource manager scripts',
      // },
    ]);
  }
}
