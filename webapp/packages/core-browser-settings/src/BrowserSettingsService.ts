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

const settingsSchema = schema.object({
  'cookies.disabled': schema.coerce.boolean().default(false),
});

export type CookiesSettings = schema.infer<typeof settingsSchema>;

@injectable()
export class BrowserSettingsService extends Dependency {
  readonly settings: PluginSettings<typeof settingsSchema>;

  constructor(
    private readonly pluginManagerService: PluginManagerService,
    private readonly settingsManagerService: SettingsManagerService,
    private readonly serverSettingsService: ServerSettingsService,
    private readonly serverSettingsResolverService: ServerSettingsResolverService,
  ) {
    super();
    this.settings = this.pluginManagerService.createSettings('browser', 'core', settingsSchema);

    this.serverSettingsResolverService.addResolver(
      /** @deprecated Use settings instead, will be removed in 23.0.0 */
      createSettingsAliasResolver(this.serverSettingsService, this.settings, 'core'),
    );
    this.registerSettings();
  }

  private registerSettings() {
    this.settingsManagerService.registerSettings(this.settings, () => [
      // {
      //   group: BROWSER_COOKIES_SETTINGS_GROUP,
      //   key: 'cookies.disabled',
      //   name: 'Disable',
      //   type: ESettingsValueType.Checkbox,
      // },
    ]);
  }
}
