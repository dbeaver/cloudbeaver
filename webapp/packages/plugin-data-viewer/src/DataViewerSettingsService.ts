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
  disableEdit: false,
};

export type DataViewerSettings = typeof defaultSettings;

@injectable()
export class DataViewerSettingsService {
  readonly settings: PluginSettings<DataViewerSettings>;
  /** @deprecated Use settings instead, will be removed in 23.0.0 */
  readonly deprecatedSettings: PluginSettings<typeof defaultSettings>;

  constructor(private readonly pluginManagerService: PluginManagerService) {
    this.settings = this.pluginManagerService.getPluginSettings('data-viewer', defaultSettings);
    this.deprecatedSettings = this.pluginManagerService.getDeprecatedPluginSettings('core.app.dataViewer', defaultSettings);
  }
}