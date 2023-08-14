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
  'app.logViewer.refreshTimeout': 3000,
  'app.logViewer.maxLogRecords': 1000,
  'app.logViewer.logBatchSize': 2000,
  'app.logViewer.maxFailedRequests': 3,
  'app.navigationTree.childrenLimit': 100,
  'app.metadata.editing': true,
  'app.metadata.deleting': true,
};

export type CoreSettings = typeof defaultSettings;

/**
 * @deprecated use plugin-log-viewer, core-navigation-tree settings instead
 */
@injectable()
export class CoreSettingsService {
  readonly settings: PluginSettings<CoreSettings>;

  constructor(private readonly pluginManagerService: PluginManagerService) {
    this.settings = this.pluginManagerService.getDeprecatedPluginSettings('core', defaultSettings);
  }
}
