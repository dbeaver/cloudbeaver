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
  fetchMin: 100,
  fetchMax: 5000,
  fetchDefault: 200,
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

  getDefaultRowsCount(count?: number): number {
    if (typeof count === 'number' && Number.isNaN(count)) {
      count = 0;
    }
    return count !== undefined
      ? Math.max(
        this.settings.getValue('fetchMin'),
        Math.min(count, this.settings.getValue('fetchMax'))
      )
      : this.settings.getValue('fetchDefault');
  }
}