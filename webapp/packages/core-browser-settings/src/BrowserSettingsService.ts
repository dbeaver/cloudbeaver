/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { SettingsManagerService, SettingsProvider, SettingsProviderService } from '@cloudbeaver/core-settings';
import { schema, schemaExtra } from '@cloudbeaver/core-utils';

const settingsSchema = schema.object({
  'core.browser.cookies.disabled': schemaExtra.stringedBoolean().default(false),
});

export type BrowserSettingsSchema = typeof settingsSchema;
export type CookiesSettings = schema.infer<BrowserSettingsSchema>;

@injectable(() => [SettingsProviderService, SettingsManagerService])
export class BrowserSettingsService {
  get disabled(): boolean {
    return this.settings.getValue('core.browser.cookies.disabled');
  }
  readonly settings: SettingsProvider<BrowserSettingsSchema>;

  constructor(
    private readonly settingsProviderService: SettingsProviderService,
    private readonly settingsManagerService: SettingsManagerService,
  ) {
    this.settings = this.settingsProviderService.createSettings(settingsSchema);
    this.registerSettings();
  }

  private registerSettings() {
    this.settingsManagerService.registerSettings<typeof settingsSchema>(() => [
      // {
      //   group: BROWSER_COOKIES_SETTINGS_GROUP,
      //   key: 'cookies.disabled',
      //   name: 'Disable',
      //   type: ESettingsValueType.Checkbox,
      // },
    ]);
  }
}
