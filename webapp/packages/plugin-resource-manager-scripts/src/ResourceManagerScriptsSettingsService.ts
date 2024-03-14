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

type Settings = typeof settingsSchema;

@injectable()
export class ResourceManagerScriptsSettingsService extends Dependency {
  readonly settings: SettingsProvider<Settings>;

  constructor(
    private readonly settingsProviderService: SettingsProviderService,
    private readonly settingsManagerService: SettingsManagerService,
  ) {
    super();
    this.settings = this.settingsProviderService.createSettings(settingsSchema, 'plugin', 'resource-manager-scripts');

    this.registerSettings();
  }

  private registerSettings() {
    this.settingsManagerService.registerSettings(this.settings.scope, this.settings.schema, () => [
      // {
      //   group: RESOURCE_MANAGER_SETTINGS_GROUP,
      //   key: 'disabled',
      //   type: ESettingsValueType.Checkbox,
      //   name: 'Disable resource manager scripts',
      // },
    ]);
  }
}
