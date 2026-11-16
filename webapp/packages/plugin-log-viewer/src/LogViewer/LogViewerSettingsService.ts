/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { ESettingsValueType, SettingsManagerService, SettingsProvider, SettingsProviderService } from '@cloudbeaver/core-settings';
import { schema, schemaExtra } from '@cloudbeaver/core-utils';
import { TOOLS_PANEL_SETTINGS_GROUP } from '@cloudbeaver/plugin-tools-panel';

const defaultSettings = schema.object({
  'plugin.log-viewer.maxLogRecords': schema.coerce.number().default(1000),
  'plugin.log-viewer.logBatchSize': schema.coerce.number().default(2000),
  'plugin.log-viewer.disabled': schemaExtra.stringedBoolean().default(false),
});

export type LogViewerSettingsSchema = typeof defaultSettings;
export type LogViewerSettings = schema.infer<LogViewerSettingsSchema>;

export class LogViewerSettingsServiceImpl {
  get disabled(): boolean {
    return this.settings.getValue('plugin.log-viewer.disabled');
  }

  get maxLogRecords(): number {
    return this.settings.getValue('plugin.log-viewer.maxLogRecords');
  }

  get logBatchSize(): number {
    return this.settings.getValue('plugin.log-viewer.logBatchSize');
  }

  readonly settings: SettingsProvider<LogViewerSettingsSchema>;

  constructor(
    private readonly settingsProviderService: SettingsProviderService,
    private readonly settingsManagerService: SettingsManagerService,
  ) {
    this.settings = this.settingsProviderService.createSettings(defaultSettings);

    this.registerSettings();
  }

  private registerSettings() {
    this.settingsManagerService.registerSettings<typeof defaultSettings>(() => [
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

export type LogViewerSettingsService = LogViewerSettingsServiceImpl;

export class LogViewerSettingsServiceDI extends Context.Service<LogViewerSettingsServiceDI, LogViewerSettingsServiceImpl>()(
  '@cloudbeaver/plugin-log-viewer/LogViewer/LogViewerSettingsService#LogViewerSettingsService',
) {
  static readonly implementation = LogViewerSettingsServiceImpl;

  static readonly dependencies = () => [SettingsProviderService, SettingsManagerService] as const;
  static readonly make: Effect.Effect<
    LogViewerSettingsServiceImpl,
    never,
    Context.Service.Identifier<typeof SettingsProviderService> | Context.Service.Identifier<typeof SettingsManagerService>
  > = Effect.gen(function* makeLogViewerSettingsService() {
    const settingsProviderService = yield* SettingsProviderService;
    const settingsManagerService = yield* SettingsManagerService;

    return new LogViewerSettingsServiceImpl(settingsProviderService, settingsManagerService);
  });
  static readonly layer: Layer.Layer<
    LogViewerSettingsServiceDI,
    never,
    Context.Service.Identifier<typeof SettingsProviderService> | Context.Service.Identifier<typeof SettingsManagerService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const LogViewerSettingsService = LogViewerSettingsServiceDI;
