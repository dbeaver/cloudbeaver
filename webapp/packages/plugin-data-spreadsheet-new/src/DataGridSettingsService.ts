/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { PluginManagerService } from '@cloudbeaver/core-plugin';

const defaultSettings = {
  hidden: true,
};

export type DataGridSettings = typeof defaultSettings;

@injectable()
export class DataGridSettingsService {
  readonly settings = this.pluginManagerService.getPluginSettings('react_data_grid', defaultSettings);

  constructor(private pluginManagerService: PluginManagerService) { }
}
