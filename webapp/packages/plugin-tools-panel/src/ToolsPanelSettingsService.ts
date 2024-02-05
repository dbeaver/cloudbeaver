/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Dependency, injectable } from '@cloudbeaver/core-di';
import { ESettingsValueType, PluginManagerService, PluginSettings, SettingsManagerService } from '@cloudbeaver/core-plugin';
import { schema } from '@cloudbeaver/core-utils';

import { TOOLS_PANEL_SETTINGS_GROUP } from './TOOLS_PANEL_SETTINGS_GROUP';

const settings = schema.object({
  disabled: schema.coerce.boolean().default(false),
});

type Settings = typeof settings;

@injectable()
export class ToolsPanelSettingsService extends Dependency {
  readonly settings: PluginSettings<Settings>;

  constructor(private readonly pluginManagerService: PluginManagerService, private readonly settingsManagerService: SettingsManagerService) {
    super();
    this.settings = this.pluginManagerService.createSettings('tools-panel', 'plugin', settings);

    this.registerSettings();
  }

  private registerSettings() {
    this.settingsManagerService.registerSettings(this.settings, () => [
      {
        group: TOOLS_PANEL_SETTINGS_GROUP,
        key: 'disabled',
        type: ESettingsValueType.Checkbox,
        name: 'plugin_tools_panel_settings_disable_label',
        description: 'plugin_tools_panel_settings_disable_description',
      },
    ]);
  }
}
