/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { PluginManagerService, PluginSettings } from '@cloudbeaver/core-plugin';

import { themes } from './themes';

interface IDefaultSettings {
  defaultTheme: string;
}

export const defaultThemeSettings: IDefaultSettings = {
  defaultTheme: themes[0].id,
};

@injectable()
export class ThemeSettingsService {
  readonly settings: PluginSettings<IDefaultSettings>;

  constructor(private readonly pluginManagerService: PluginManagerService) {
    this.settings = this.pluginManagerService.getPluginSettings('core.user', defaultThemeSettings);
  }
}
