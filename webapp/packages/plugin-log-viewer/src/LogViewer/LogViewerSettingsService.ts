/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Dependency, injectable } from '@cloudbeaver/core-di';
import {
  createSettingsAliasResolver,
  ROOT_SETTINGS_LAYER,
  SettingsManagerService,
  SettingsProvider,
  SettingsProviderService,
  SettingsResolverService,
} from '@cloudbeaver/core-settings';
import { schema, schemaExtra } from '@cloudbeaver/core-utils';

const defaultSettings = schema.object({
  'plugin.log-viewer.refreshTimeout': schema.coerce.number().default(3000),
  'plugin.log-viewer.maxLogRecords': schema.coerce.number().default(1000),
  'plugin.log-viewer.logBatchSize': schema.coerce.number().default(2000),
  'plugin.log-viewer.maxFailedRequests': schema.coerce.number().default(3),
  'plugin.log-viewer.disabled': schemaExtra.stringedBoolean().default(false),
});

export type LogViewerSettings = schema.infer<typeof defaultSettings>;

@injectable()
export class LogViewerSettingsService extends Dependency {
  get disabled(): boolean {
    return this.settings.getValue('plugin.log-viewer.disabled');
  }

  get refreshTimeout(): number {
    return this.settings.getValue('plugin.log-viewer.refreshTimeout');
  }

  get maxLogRecords(): number {
    return this.settings.getValue('plugin.log-viewer.maxLogRecords');
  }

  get logBatchSize(): number {
    return this.settings.getValue('plugin.log-viewer.logBatchSize');
  }

  get maxFailedRequests(): number {
    return this.settings.getValue('plugin.log-viewer.maxFailedRequests');
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
        'plugin.log-viewer.maxFailedRequests': 'core.app.logViewer.maxFailedRequests',
        'plugin.log-viewer.maxLogRecords': 'core.app.logViewer.maxLogRecords',
        'plugin.log-viewer.refreshTimeout': 'core.app.logViewer.refreshTimeout',
      }),
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
      //   key: 'plugin.log-viewer.disabled',
      //   access: {
      //     scope: ['server', 'client'],
      //   },
      //   group: LOG_VIEWER_SETTINGS_GROUP,
      //   type: ESettingsValueType.Checkbox,
      //   name: 'Disable log viewer',
      //   description: 'Disable log viewer',
      // },
    ]);
  }
}
