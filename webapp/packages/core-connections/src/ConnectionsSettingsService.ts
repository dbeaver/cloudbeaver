/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Dependency, injectable } from '@cloudbeaver/core-di';
import { ESettingsValueType, SettingsManagerService, SettingsProvider, SettingsProviderService } from '@cloudbeaver/core-settings';
import { schema, schemaExtra } from '@cloudbeaver/core-utils';
import { CONNECTIONS_SETTINGS_GROUP } from './CONNECTIONS_SETTINGS_GROUP.js';

const settingsSchema = schema.object({
  'core.connections.disabled': schemaExtra.stringedBoolean().default(false),
});

export type ConnectionsSettings = schema.infer<typeof settingsSchema>;

@injectable()
export class ConnectionsSettingsService extends Dependency {
  get disabled(): boolean {
    return this.settings.getValue('core.connections.disabled');
  }
  readonly settings: SettingsProvider<typeof settingsSchema>;

  constructor(
    private readonly settingsProviderService: SettingsProviderService,
    private readonly settingsManagerService: SettingsManagerService,
  ) {
    super();
    this.settings = this.settingsProviderService.createSettings(settingsSchema);
    this.registerSettings();
  }

  private registerSettings() {
    this.settingsManagerService.registerSettings(this.settings, () => [
      {
        group: CONNECTIONS_SETTINGS_GROUP,
        key: 'core.connections.disabled',
        access: {
          scope: ['role'],
        },
        name: 'core_connections_settings_disable',
        description: 'core_connections_settings_disable_description',
        type: ESettingsValueType.Checkbox,
      },
    ]);
  }
}
