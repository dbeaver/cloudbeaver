/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { PluginManagerService, PluginSettings } from '@cloudbeaver/core-plugin';

const settings = {
  disabled: false,
};

type Settings = typeof settings;

@injectable()
export class ToolsPanelSettingsService {
  readonly settings: PluginSettings<Settings>;

  constructor(private readonly pluginManagerService: PluginManagerService) {
    this.settings = this.pluginManagerService.createSettings('tools-panel', 'plugin', settings);
  }
}
