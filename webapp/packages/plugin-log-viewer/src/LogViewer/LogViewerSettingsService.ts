/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Dependency, injectable } from '@cloudbeaver/core-di';
import {
  createSettingsAliasResolver,
  ESettingsValueType,
  ROOT_SETTINGS_LAYER,
  SettingsManagerService,
  SettingsProvider,
  SettingsProviderService,
  SettingsResolverService,
} from '@cloudbeaver/core-settings';
import { schema, schemaExtra } from '@cloudbeaver/core-utils';
import { TOOLS_PANEL_SETTINGS_GROUP } from '@cloudbeaver/plugin-tools-panel';

const defaultSettings = schema.object({
  'plugin.log-viewer.maxLogRecords': schema.coerce.number().default(1000),
  'plugin.log-viewer.logBatchSize': schema.coerce.number().default(2000),
  'plugin.log-viewer.disabled': schemaExtra.stringedBoolean().default(false),
});

export type LogViewerSettings = schema.infer<typeof defaultSettings>;

@injectable()
export class LogViewerSettingsService extends Dependency {
  get disabled(): boolean {
    return this.settings.getValue('plugin.log-viewer.disabled');
  }

  get maxLogRecords(): number {
    return this.settings.getValue('plugin.log-viewer.maxLogRecords');
  }

  get logBatchSize(): number {
    return this.settings.getValue('plugin.log-viewer.logBatchSize');
  }

  readonly settings: SettingsProvider<typeof defaultSettings>;

  constructor(
    private readonly settingsProviderService: SettingsProviderService,
    private readonly settingsManagerService: SettingsManagerService,
    private readonly settingsResolverService: SettingsResolverService,
  ) {
    super();
    this.settings = this.settingsProviderService.createSettings(defaultSettings);
    this.settingsResolverService.addResolver(
      ROOT_SETTINGS_LAYER,
      /** @deprecated Use settings instead, will be removed in 23.0.0 */
      createSettingsAliasResolver(this.settingsResolverService, this.settings, {
        'plugin.log-viewer.disabled': 'core.app.logViewer.disabled',
        'plugin.log-viewer.logBatchSize': 'core.app.logViewer.logBatchSize',
        'plugin.log-viewer.maxLogRecords': 'core.app.logViewer.maxLogRecords',
      }),
    );

    this.registerSettings();
  }

  private registerSettings() {
    this.settingsManagerService.registerSettings(this.settings, () => [
      // {
      //   group: LOG_VIEWER_SETTINGS_GROUP,
      //   key: 'plugin.log-viewer.maxLogRecords',
      //   access: {
      //     scope: ['client'],
      //   },
      //   type: ESettingsValueType.Input,
      //   name: 'plugin_log_viewer_settings_max_log_records',
      //   description: 'plugin_log_viewer_settings_max_log_records_description',
      // },
      // {
      //   group: LOG_VIEWER_SETTINGS_GROUP,
      //   key: 'plugin.log-viewer.logBatchSize',
      //   access: {
      //     scope: ['client'],
      //   },
      //   type: ESettingsValueType.Input,
      //   name: 'plugin_log_viewer_settings_log_batch_size',
      //   description: 'plugin_log_viewer_settings_log_batch_size_description',
      // },
      {
        key: 'plugin.log-viewer.disabled',
        access: {
          scope: ['server', 'role'],
        },
        group: TOOLS_PANEL_SETTINGS_GROUP,
        type: ESettingsValueType.Checkbox,
        name: 'plugin_log_viewer_settings_disable',
        description: 'plugin_log_viewer_settings_disable_description',
      },
    ]);
  }
}
