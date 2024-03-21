/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { SettingsProvider, SettingsProviderService } from '@cloudbeaver/core-settings';
import { schema } from '@cloudbeaver/core-utils';

import { DEFAULT_THEME_ID } from './themes';

const settingsSchema = schema.object({
  'core.theming.theme': schema.string().default(DEFAULT_THEME_ID),
});

export type IThemeSettings = schema.infer<typeof settingsSchema>;

@injectable()
export class ThemeSettingsService {
  get theme(): string {
    return this.settings.getValue('core.theming.theme');
  }
  readonly settings: SettingsProvider<typeof settingsSchema>;

  constructor(private readonly settingsProviderService: SettingsProviderService) {
    this.settings = this.settingsProviderService.createSettings(settingsSchema);
  }
}
