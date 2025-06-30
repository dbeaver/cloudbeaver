/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import {
  createSettingsAliasResolver,
  ROOT_SETTINGS_LAYER,
  SettingsProvider,
  SettingsProviderService,
  SettingsResolverService,
} from '@cloudbeaver/core-settings';
import { schema } from '@cloudbeaver/core-utils';

import { FALLBACK_THEME_ID } from './themes.js';

const settingsSchema = schema.object({
  'core.theming.theme': schema.string().default(FALLBACK_THEME_ID),
});

export type IThemeSettings = schema.infer<typeof settingsSchema>;
export type IThemeSettingsKey = keyof IThemeSettings;

@injectable()
export class ThemeSettingsService {
  get theme(): string {
    return this.settings.getValue('core.theming.theme');
  }
  readonly settings: SettingsProvider<typeof settingsSchema>;

  constructor(
    private readonly settingsProviderService: SettingsProviderService,
    private readonly settingsResolverService: SettingsResolverService,
  ) {
    this.settings = this.settingsProviderService.createSettings(settingsSchema);

    this.settingsResolverService.addResolver(
      ROOT_SETTINGS_LAYER,
      /** @deprecated Use settings instead, will be removed in 23.0.0 */
      createSettingsAliasResolver(this.settingsResolverService, this.settings, { 'core.theming.theme': 'core.user.defaultTheme' }),
      createSettingsAliasResolver(this.settingsResolverService, this.settings, {
        'core.theming.theme': 'core.localization.defaultTheme',
      }),
      createSettingsAliasResolver(this.settingsResolverService, this.settings, { 'core.theming.theme': 'app.defaultTheme' }),
    );
  }
}
