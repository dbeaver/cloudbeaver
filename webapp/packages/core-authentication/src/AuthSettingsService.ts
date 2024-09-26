/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { SettingsManagerService, SettingsProvider, SettingsProviderService } from '@cloudbeaver/core-settings';
import { schema, schemaExtra } from '@cloudbeaver/core-utils';

const settingsSchema = schema.object({
  'core.authentication.disableAnonymousAccess': schemaExtra.stringedBoolean().default(false),
});

export type AuthSettings = schema.infer<typeof settingsSchema>;

@injectable()
export class AuthSettingsService {
  get disableAnonymousAccess(): boolean {
    return this.settings.getValue('core.authentication.disableAnonymousAccess');
  }
  readonly settings: SettingsProvider<typeof settingsSchema>;

  constructor(
    private readonly settingsProviderService: SettingsProviderService,
    private readonly settingsManagerService: SettingsManagerService,
  ) {
    this.settings = this.settingsProviderService.createSettings(settingsSchema);

    this.registerSettings();
  }

  private registerSettings() {
    this.settingsManagerService.registerSettings(this.settings, () => [
      // {
      //   key: 'core.authentication.disableAnonymousAccess',
      //   access: {
      //     scope: ['server'],
      //   },
      //   type: ESettingsValueType.Checkbox,
      //   name: 'settings_authentication_disable_anonymous_access_name',
      //   description: 'settings_authentication_disable_anonymous_access_description',
      //   group: AUTH_SETTINGS_GROUP,
      // },
    ]);
  }
}
