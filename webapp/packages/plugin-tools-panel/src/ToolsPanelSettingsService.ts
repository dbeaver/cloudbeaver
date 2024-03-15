/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Dependency, injectable } from '@cloudbeaver/core-di';
import { ESettingsValueType, SettingsManagerService, SettingsProvider, SettingsProviderService } from '@cloudbeaver/core-settings';
import { schema, schemaExtra } from '@cloudbeaver/core-utils';

import { TOOLS_PANEL_SETTINGS_GROUP } from './TOOLS_PANEL_SETTINGS_GROUP';

const settings = schema.object({
  disabled: schemaExtra.stringedBoolean().default(false),
});

type Settings = typeof settings;

@injectable()
export class ToolsPanelSettingsService extends Dependency {
  readonly settings: SettingsProvider<Settings>;

  constructor(
    private readonly settingsProviderService: SettingsProviderService,
    private readonly settingsManagerService: SettingsManagerService,
  ) {
    super();
    this.settings = this.settingsProviderService.createSettings(settings, 'plugin', 'tools-panel');

    this.registerSettings();
  }

  private registerSettings() {
    this.settingsManagerService.registerSettings(this.settings, () => [
      {
        key: 'disabled',
        access: {
          accessor: ['server'],
        },
        group: TOOLS_PANEL_SETTINGS_GROUP,
        type: ESettingsValueType.Checkbox,
        name: 'plugin_tools_panel_settings_disable_label',
        description: 'plugin_tools_panel_settings_disable_description',
      },
    ]);
  }
}
