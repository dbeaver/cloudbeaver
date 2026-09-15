/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { SettingsProvider, SettingsProviderService } from '@cloudbeaver/core-settings';
import { schema } from '@cloudbeaver/core-utils';

import { FALLBACK_THEME_ID } from './themes.js';

const settingsSchema = schema.object({
  'core.theming.theme': schema.string().default(FALLBACK_THEME_ID),
});

export type IThemeSettingsSchema = typeof settingsSchema;
export type IThemeSettings = schema.infer<IThemeSettingsSchema>;
export type IThemeSettingsKey = keyof IThemeSettings;

@injectable(() => [SettingsProviderService])
export class ThemeSettingsService {
  get theme(): string {
    return this.settings.getValue('core.theming.theme');
  }
  readonly settings: SettingsProvider<IThemeSettingsSchema>;

  constructor(private readonly settingsProviderService: SettingsProviderService) {
    this.settings = this.settingsProviderService.createSettings(settingsSchema);
  }
}
