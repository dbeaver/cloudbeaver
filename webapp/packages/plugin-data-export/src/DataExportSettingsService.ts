/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Dependency, injectable } from '@cloudbeaver/core-di';
import { createSettingsAliasResolver, PluginManagerService, PluginSettings, SettingsManagerService } from '@cloudbeaver/core-plugin';
import { ServerSettingsResolverService, ServerSettingsService } from '@cloudbeaver/core-root';
import { schema } from '@cloudbeaver/core-utils';

const defaultSettings = schema.object({
  disabled: schema.coerce.boolean().default(false),
});

export type DataExportSettings = schema.infer<typeof defaultSettings>;

@injectable()
export class DataExportSettingsService extends Dependency {
  readonly settings: PluginSettings<typeof defaultSettings>;

  constructor(
    private readonly pluginManagerService: PluginManagerService,
    private readonly settingsManagerService: SettingsManagerService,
    private readonly serverSettingsService: ServerSettingsService,
    private readonly serverSettingsResolverService: ServerSettingsResolverService,
  ) {
    super();
    this.settings = this.pluginManagerService.createSettings('data-export', 'plugin', defaultSettings);
    this.serverSettingsResolverService.addResolver(
      /** @deprecated Use settings instead, will be removed in 23.0.0 */
      createSettingsAliasResolver(this.serverSettingsService, this.settings, 'plugin_data_export'),
    );

    this.registerSettings();
  }

  private registerSettings() {
    this.settingsManagerService.registerSettings(this.settings, () => [
      // {
      //   group: DATA_EXPORT_SETTINGS_GROUP,
      //   key: 'disabled',
      //   type: ESettingsValueType.Checkbox,
      //   name: 'Disable data export',
      // },
    ]);
  }
}
