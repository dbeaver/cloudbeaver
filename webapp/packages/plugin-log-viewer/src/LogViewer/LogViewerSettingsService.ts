/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Dependency, injectable } from '@cloudbeaver/core-di';
import { createSettingsAliasResolver, PluginManagerService, PluginSettings, SettingsManagerService } from '@cloudbeaver/core-plugin';
import { ServerSettingsResolverService, ServerSettingsService } from '@cloudbeaver/core-root';
import { schema } from '@cloudbeaver/core-utils';

const defaultSettings = schema.object({
  refreshTimeout: schema.coerce.number().default(3000),
  maxLogRecords: schema.coerce.number().default(1000),
  logBatchSize: schema.coerce.number().default(2000),
  maxFailedRequests: schema.coerce.number().default(3),
  disabled: schema.coerce.boolean().default(false),
});

export type LogViewerSettings = schema.infer<typeof defaultSettings>;

@injectable()
export class LogViewerSettingsService extends Dependency {
  readonly settings: PluginSettings<typeof defaultSettings>;

  constructor(
    private readonly pluginManagerService: PluginManagerService,
    private readonly settingsManagerService: SettingsManagerService,
    private readonly serverSettingsService: ServerSettingsService,
    private readonly serverSettingsResolverService: ServerSettingsResolverService,
  ) {
    super();
    this.settings = this.pluginManagerService.createSettings('log-viewer', 'plugin', defaultSettings);
    this.serverSettingsResolverService.addResolver(
      /** @deprecated Use settings instead, will be removed in 23.0.0 */
      createSettingsAliasResolver(this.serverSettingsService, this.settings, 'core.app.logViewer'),
    );

    this.registerSettings();
  }

  private registerSettings() {
    this.settingsManagerService.registerSettings(this.settings, () => [
      // {
      //   group: LOG_VIEWER_SETTINGS_GROUP,
      //   key: 'refreshTimeout',
      //   type: ESettingsValueType.Input,
      //   name: 'Refresh timeout',
      //   description: 'Refresh timeout in milliseconds',
      // },
      // {
      //   group: LOG_VIEWER_SETTINGS_GROUP,
      //   key: 'maxLogRecords',
      //   type: ESettingsValueType.Input,
      //   name: 'Max log records',
      //   description: 'Max log records',
      // },
      // {
      //   group: LOG_VIEWER_SETTINGS_GROUP,
      //   key: 'logBatchSize',
      //   type: ESettingsValueType.Input,
      //   name: 'Log batch size',
      //   description: 'Log batch size',
      // },
      // {
      //   group: LOG_VIEWER_SETTINGS_GROUP,
      //   key: 'maxFailedRequests',
      //   type: ESettingsValueType.Input,
      //   name: 'Max failed requests',
      //   description: 'Max failed requests',
      // },
      // {
      //   group: LOG_VIEWER_SETTINGS_GROUP,
      //   key: 'disabled',
      //   type: ESettingsValueType.Checkbox,
      //   name: 'Disable log viewer',
      //   description: 'Disable log viewer',
      // },
    ]);
  }
}
