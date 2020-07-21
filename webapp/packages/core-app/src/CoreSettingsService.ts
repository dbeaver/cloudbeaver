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
  'app.logViewer.refreshTimeout': 3000,
  'app.logViewer.maxLogRecords': 1000,
  'app.logViewer.logBatchSize': 2000,
  'app.logViewer.maxFailedRequests': 3,
};

export type CoreSettings = typeof defaultSettings

@injectable()
export class CoreSettingsService {

  readonly settings = this.pluginManagerService.getPluginSettings('core', defaultSettings);

  constructor(private pluginManagerService: PluginManagerService) { }
}
