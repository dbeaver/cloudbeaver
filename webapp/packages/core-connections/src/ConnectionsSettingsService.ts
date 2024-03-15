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

const settingsSchema = schema.object({
  disabled: schemaExtra.stringedBoolean().default(false),
});

export type ConnectionsSettings = schema.infer<typeof settingsSchema>;

@injectable()
export class ConnectionsSettingsService extends Dependency {
  readonly settings: SettingsProvider<typeof settingsSchema>;

  constructor(
    private readonly settingsProviderService: SettingsProviderService,
    private readonly settingsManagerService: SettingsManagerService,
  ) {
    super();
    this.settings = this.settingsProviderService.createSettings(settingsSchema, 'core', 'connections');
    this.registerSettings();
  }

  private registerSettings() {
    this.settingsManagerService.registerSettings(this.settings, () => [
      // {
      //   group: CONNECTIONS_SETTINGS_GROUP,
      //   key: 'disabled',
      //   name: 'Disable',
      //   type: ESettingsValueType.Checkbox,
      // },
    ]);
  }
}
