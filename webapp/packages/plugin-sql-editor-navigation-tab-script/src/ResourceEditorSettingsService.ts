/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Dependency, injectable } from '@cloudbeaver/core-di';
import { PluginManagerService, PluginSettings, SettingsManagerService } from '@cloudbeaver/core-plugin';
import { schema } from '@cloudbeaver/core-utils';

const defaultSettings = schema.object({});

export type ResourceEditorSettings = typeof defaultSettings;

@injectable()
export class ResourceEditorSettingsService extends Dependency {
  readonly settings: PluginSettings<ResourceEditorSettings>;

  constructor(private readonly pluginManagerService: PluginManagerService, private readonly settingsManagerService: SettingsManagerService) {
    super();
    this.settings = this.pluginManagerService.createSettings('sql-editor-navigation-tab-resource', 'plugin', defaultSettings);

    this.registerSettings();
  }

  private registerSettings() {
    this.settingsManagerService.registerSettings(this.settings, () => []);
  }
}
