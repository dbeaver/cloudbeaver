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

const settings = schema.object({
  disabled: schema.coerce.boolean().default(false),
});

@injectable()
export class ConnectionSearchSettingsService extends Dependency {
  readonly settings: PluginSettings<typeof settings>;

  constructor(private readonly pluginManagerService: PluginManagerService, private readonly settingsManagerService: SettingsManagerService) {
    super();
    this.settings = this.pluginManagerService.createSettings('connection-search', 'plugin', settings);

    this.registerSettings();
  }

  private registerSettings() {
    this.settingsManagerService.registerSettings(this.settings, () => [
      // {
      //   group: CONNECTIONS_SETTINGS_GROUP,
      //   key: 'disabled',
      //   type: ESettingsValueType.Checkbox,
      //   name: 'Disable connection search',
      // },
    ]);
  }
}
