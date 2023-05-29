/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { PluginManagerService, PluginSettings } from '@cloudbeaver/core-plugin';

const defaultSettings = {
  refreshTimeout: 3000,
  maxLogRecords: 1000,
  logBatchSize: 2000,
  maxFailedRequests: 3,
  disabled: false,
};

export type LogViewerSettings = typeof defaultSettings;

@injectable()
export class LogViewerSettingsService {
  readonly settings: PluginSettings<LogViewerSettings>;

  constructor(private readonly pluginManagerService: PluginManagerService) {
    this.settings = this.pluginManagerService.getPluginSettings('log-viewer', defaultSettings);
  }
}
