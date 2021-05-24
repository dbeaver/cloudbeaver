/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { PluginManagerService } from '@cloudbeaver/core-plugin';

const defaultSettings = {
  disabled: false,
};

export type DataExportSettings = typeof defaultSettings;

@injectable()
export class DataExportSettingsService {
  readonly settings = this.pluginManagerService.getPluginSettings('plugin_data_export', defaultSettings);

  constructor(private pluginManagerService: PluginManagerService) { }
}
