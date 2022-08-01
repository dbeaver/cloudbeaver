/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { PluginManagerService, PluginSettings } from '@cloudbeaver/core-plugin';

const defaultSettings = {
  'cookies.disabled': false,
};

/** @deprecated don't use */
const deprecatedDefaultSettings = {
  disabled: false,
};

export type CookiesSettings = typeof defaultSettings;

/** @deprecated don't use */
export type DeprecatedCookiesSettings = typeof deprecatedDefaultSettings;

@injectable()
export class BrowserSettingsService {
  readonly settings: PluginSettings<CookiesSettings>;
  /** @deprecated Use settings instead, will be removed in 23.0.0 */
  readonly deprecatedSettings: PluginSettings<DeprecatedCookiesSettings>;

  constructor(private readonly pluginManagerService: PluginManagerService) {
    this.settings = this.pluginManagerService.getCoreSettings('browser', defaultSettings);
    this.deprecatedSettings = this.pluginManagerService.getCoreSettings('cookies', deprecatedDefaultSettings);
  }
}
