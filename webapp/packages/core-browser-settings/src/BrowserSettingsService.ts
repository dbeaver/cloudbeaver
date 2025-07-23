/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Dependency, injectable } from '@cloudbeaver/core-di';
import {
  createSettingsAliasResolver,
  ROOT_SETTINGS_LAYER,
  SettingsManagerService,
  SettingsProvider,
  SettingsProviderService,
  SettingsResolverService,
} from '@cloudbeaver/core-settings';
import { schema, schemaExtra } from '@cloudbeaver/core-utils';

const settingsSchema = schema.object({
  'core.browser.cookies.disabled': schemaExtra.stringedBoolean().default(false),
});

export type BrowserSettingsSchema = typeof settingsSchema;
export type CookiesSettings = schema.infer<BrowserSettingsSchema>;

@injectable()
export class BrowserSettingsService extends Dependency {
  get disabled(): boolean {
    return this.settings.getValue('core.browser.cookies.disabled');
  }
  readonly settings: SettingsProvider<BrowserSettingsSchema>;

  constructor(
    private readonly settingsProviderService: SettingsProviderService,
    private readonly settingsManagerService: SettingsManagerService,
    private readonly settingsResolverService: SettingsResolverService,
  ) {
    super();
    this.settings = this.settingsProviderService.createSettings(settingsSchema);

    this.settingsResolverService.addResolver(
      ROOT_SETTINGS_LAYER,
      /** @deprecated Use settings instead, will be removed in 23.0.0 */
      createSettingsAliasResolver<BrowserSettingsSchema>(this.settingsResolverService, {
        'core.browser.cookies.disabled': 'core.cookies.disabled',
      }),
    );
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
