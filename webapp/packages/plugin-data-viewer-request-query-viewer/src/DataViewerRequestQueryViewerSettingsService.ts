/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { SettingsProvider, SettingsProviderService } from '@cloudbeaver/core-settings';
import { schema, schemaExtra } from '@cloudbeaver/core-utils';

const defaultSettings = schema.object({
  'plugin.data-viewer-request-query-viewer.disabled': schemaExtra.stringedBoolean().default(false),
});

export type DataViewerRequestQueryViewerSettingsSchema = typeof defaultSettings;
export type DataViewerRequestQueryViewerSettings = schema.infer<typeof defaultSettings>;

export class DataViewerRequestQueryViewerSettingsServiceImpl {
  get disabled(): boolean {
    return this.settings.getValue('plugin.data-viewer-request-query-viewer.disabled');
  }

  readonly settings: SettingsProvider<typeof defaultSettings>;

  constructor(private readonly settingsProviderService: SettingsProviderService) {
    this.settings = this.settingsProviderService.createSettings(defaultSettings);
  }
}

export type DataViewerRequestQueryViewerSettingsService = DataViewerRequestQueryViewerSettingsServiceImpl;

export class DataViewerRequestQueryViewerSettingsServiceDI extends Context.Service<
  DataViewerRequestQueryViewerSettingsServiceDI,
  DataViewerRequestQueryViewerSettingsServiceImpl
>()('@cloudbeaver/plugin-data-viewer-request-query-viewer/DataViewerRequestQueryViewerSettingsService#DataViewerRequestQueryViewerSettingsService') {
  static readonly implementation = DataViewerRequestQueryViewerSettingsServiceImpl;

  static readonly dependencies = () => [SettingsProviderService] as const;
  static readonly make: Effect.Effect<
    DataViewerRequestQueryViewerSettingsServiceImpl,
    never,
    Context.Service.Identifier<typeof SettingsProviderService>
  > = Effect.gen(function* makeDataViewerRequestQueryViewerSettingsService() {
    const settingsProviderService = yield* SettingsProviderService;

    return new DataViewerRequestQueryViewerSettingsServiceImpl(settingsProviderService);
  });
  static readonly layer: Layer.Layer<
    DataViewerRequestQueryViewerSettingsServiceDI,
    never,
    Context.Service.Identifier<typeof SettingsProviderService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const DataViewerRequestQueryViewerSettingsService = DataViewerRequestQueryViewerSettingsServiceDI;
