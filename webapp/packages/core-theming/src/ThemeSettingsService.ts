/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { createSettingsAliasResolver, PluginManagerService, PluginSettings } from '@cloudbeaver/core-plugin';
import { ServerSettingsResolverService, ServerSettingsService } from '@cloudbeaver/core-root';
import { schema } from '@cloudbeaver/core-utils';

import { DEFAULT_THEME_ID } from './themes';

const settingsSchema = schema.object({
  defaultTheme: schema.string().default(DEFAULT_THEME_ID),
});

export type IThemeSettings = schema.infer<typeof settingsSchema>;

@injectable()
export class ThemeSettingsService {
  readonly settings: PluginSettings<typeof settingsSchema>;

  constructor(
    private readonly pluginManagerService: PluginManagerService,
    private readonly serverSettingsService: ServerSettingsService,
    private readonly serverSettingsResolverService: ServerSettingsResolverService,
  ) {
    this.settings = this.pluginManagerService.createSettings('theming', 'core', settingsSchema);
    this.serverSettingsResolverService.addResolver(
      /** @deprecated Use settings instead, will be removed in 23.0.0 */
      createSettingsAliasResolver(this.serverSettingsService, this.settings, 'core.user'),
    );
  }
}
