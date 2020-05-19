/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@dbeaver/core/di';
import { PluginManagerService } from '@dbeaver/core/plugin';

const defaultSettings = {
  'app.logViewer.refreshInterval': 3000,
  'app.logViewer.maxLogEntries': 1000,
};

export type CoreSettings = typeof defaultSettings

@injectable()
export class CoreSettingsService {

  readonly settings = this.pluginManagerService.getPluginSettings('core', defaultSettings);

  constructor(private pluginManagerService: PluginManagerService) { }
}
