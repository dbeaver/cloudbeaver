/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Dependency, injectable } from '@cloudbeaver/core-di';
import { SettingsManagerService, SettingsProvider, SettingsProviderService } from '@cloudbeaver/core-settings';
import { schema, schemaExtra } from '@cloudbeaver/core-utils';

const defaultSettings = schema.object({
  'plugin.connections.hideConnectionViewForUsers': schemaExtra.stringedBoolean().default(false),
});

export type PluginConnectionsSettings = schema.infer<typeof defaultSettings>;

@injectable()
export class PluginConnectionsSettingsService extends Dependency {
  get hideConnectionViewForUsers(): boolean {
    return this.settings.getValue('plugin.connections.hideConnectionViewForUsers');
  }
  readonly settings: SettingsProvider<typeof defaultSettings>;

  constructor(
    private readonly settingsProviderService: SettingsProviderService,
    private readonly settingsManagerService: SettingsManagerService,
  ) {
    super();
    this.settings = this.settingsProviderService.createSettings(defaultSettings);

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
