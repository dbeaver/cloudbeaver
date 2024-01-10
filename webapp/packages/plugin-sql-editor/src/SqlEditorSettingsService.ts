/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { PluginManagerService, PluginSettings } from '@cloudbeaver/core-plugin';

const defaultSettings = {
  maxFileSize: 10 * 1024, // kilobyte
  disabled: false,
  autoSave: true,
};

export type SqlEditorSettings = typeof defaultSettings;

@injectable()
export class SqlEditorSettingsService {
  readonly settings: PluginSettings<SqlEditorSettings>;
  /** @deprecated Use settings instead, will be removed in 23.0.0 */
  readonly deprecatedSettings: PluginSettings<SqlEditorSettings>;

  constructor(private readonly pluginManagerService: PluginManagerService) {
    this.settings = this.pluginManagerService.createSettings('sql-editor', 'plugin', defaultSettings);
    this.deprecatedSettings = this.pluginManagerService.getDeprecatedPluginSettings('core.app.sqlEditor', defaultSettings);
  }
}
