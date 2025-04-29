/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { CONNECTIONS_SETTINGS_GROUP } from '@cloudbeaver/core-connections';
import { Dependency, injectable } from '@cloudbeaver/core-di';
import { ESettingsValueType, SettingsManagerService, SettingsProvider, SettingsProviderService } from '@cloudbeaver/core-settings';
import { schema, schemaExtra } from '@cloudbeaver/core-utils';

const settings = schema.object({
  'plugin.connection-search.disabled': schemaExtra.stringedBoolean().default(false),
});

@injectable()
export class ConnectionSearchSettingsService extends Dependency {
  get disabled(): boolean {
    return this.settings.getValue('plugin.connection-search.disabled');
  }
  readonly settings: SettingsProvider<typeof settings>;

  constructor(
    private readonly settingsProviderService: SettingsProviderService,
    private readonly settingsManagerService: SettingsManagerService,
  ) {
    super();
    this.settings = this.settingsProviderService.createSettings(settings);

    this.registerSettings();
  }

  private registerSettings() {
    this.settingsManagerService.registerSettings(this.settings, () => [
      {
        group: CONNECTIONS_SETTINGS_GROUP,
        key: 'plugin.connection-search.disabled',
        access: {
          scope: ['server', 'role'],
        },
        type: ESettingsValueType.Checkbox,
        name: 'plugin_connection_search_settings_disable',
        description: 'plugin_connection_search_settings_disable_description',
      },
    ]);
  }
}
