/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { PluginManagerService, PluginSettings } from '@cloudbeaver/core-plugin';

const defaultSettings = {};

export type ResourceEditorSettings = typeof defaultSettings;

@injectable()
export class ResourceEditorSettingsService {
  readonly settings: PluginSettings<ResourceEditorSettings>;

  constructor(private readonly pluginManagerService: PluginManagerService) {
    this.settings = this.pluginManagerService.createSettings('sql-editor-navigation-tab-resource', 'plugin', defaultSettings);
  }
}
