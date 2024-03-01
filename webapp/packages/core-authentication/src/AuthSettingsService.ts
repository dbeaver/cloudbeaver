/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { PluginManagerService, PluginSettings, SettingsManagerService } from '@cloudbeaver/core-plugin';
import { schema } from '@cloudbeaver/core-utils';

const settingsSchema = schema.object({
  disableAnonymousAccess: schema.coerce.boolean().default(false),
});

export type AuthSettings = schema.infer<typeof settingsSchema>;

@injectable()
export class AuthSettingsService {
  readonly settings: PluginSettings<typeof settingsSchema>;

  constructor(private readonly pluginManagerService: PluginManagerService, private readonly settingsManagerService: SettingsManagerService) {
    this.settings = this.pluginManagerService.createSettings('authentication', 'core', settingsSchema);

    this.registerSettings();
  }

  private registerSettings() {
    this.settingsManagerService.registerSettings(this.settings, () => [
      // {
      //   key: 'disableAnonymousAccess',
      //   type: ESettingsValueType.Checkbox,
      //   name: 'settings_authentication_disable_anonymous_access_name',
      //   description: 'settings_authentication_disable_anonymous_access_description',
      //   group: AUTH_SETTINGS_GROUP,
      // },
    ]);
  }
}
