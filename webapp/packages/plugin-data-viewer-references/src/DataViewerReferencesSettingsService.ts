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
  'plugin.data-viewer-references.disabled': schemaExtra.stringedBoolean().default(false),
});

export type DataViewerReferencesSettingsSchema = typeof defaultSettings;
export type DataViewerReferencesSettings = schema.infer<typeof defaultSettings>;

export class DataViewerReferencesSettingsServiceImpl {
  get disabled(): boolean {
    return this.settings.getValue('plugin.data-viewer-references.disabled');
  }

  readonly settings: SettingsProvider<typeof defaultSettings>;

  constructor(private readonly settingsProviderService: SettingsProviderService) {
    this.settings = this.settingsProviderService.createSettings(defaultSettings);
  }
}

export type DataViewerReferencesSettingsService = DataViewerReferencesSettingsServiceImpl;

export class DataViewerReferencesSettingsServiceDI extends Context.Service<
  DataViewerReferencesSettingsServiceDI,
  DataViewerReferencesSettingsServiceImpl
>()('@cloudbeaver/plugin-data-viewer-references/DataViewerReferencesSettingsService#DataViewerReferencesSettingsService') {
  static readonly implementation = DataViewerReferencesSettingsServiceImpl;

  static readonly dependencies = () => [SettingsProviderService] as const;
  static readonly make: Effect.Effect<DataViewerReferencesSettingsServiceImpl, never, Context.Service.Identifier<typeof SettingsProviderService>> =
    Effect.gen(function* makeDataViewerReferencesSettingsService() {
      const settingsProviderService = yield* SettingsProviderService;

      return new DataViewerReferencesSettingsServiceImpl(settingsProviderService);
    });
  static readonly layer: Layer.Layer<DataViewerReferencesSettingsServiceDI, never, Context.Service.Identifier<typeof SettingsProviderService>> =
    Layer.effect(
      this,
      Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
    );
}

export const DataViewerReferencesSettingsService = DataViewerReferencesSettingsServiceDI;
