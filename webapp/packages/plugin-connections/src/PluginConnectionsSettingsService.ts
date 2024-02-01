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

const defaultSettings = schema.object({
  hideConnectionViewForUsers: schema.coerce.boolean().default(false),
});

export type PluginConnectionsSettings = schema.infer<typeof defaultSettings>;

@injectable()
export class PluginConnectionsSettingsService extends Dependency {
  readonly settings: PluginSettings<typeof defaultSettings>;

  constructor(private readonly pluginManagerService: PluginManagerService, private readonly settingsManagerService: SettingsManagerService) {
    super();
    this.settings = this.pluginManagerService.createSettings('connections', 'plugin', defaultSettings);

    this.registerSettings();
  }

  private registerSettings() {
    this.settingsManagerService.registerSettings(this.settings, () => [
      // {
      //   key: 'hideConnectionViewForUsers',
      //   type: ESettingsValueType.Checkbox,
      //   name: 'settings_connections_hide_connections_view_name',
      //   description: 'settings_connections_hide_connections_view_description',
      //   group: CONNECTIONS_SETTINGS_GROUP,
      // },
    ]);
  }
}
