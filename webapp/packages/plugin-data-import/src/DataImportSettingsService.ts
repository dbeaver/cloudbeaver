/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, disposeService, Effect, Layer } from '@cloudbeaver/core-di';
import { HIGHEST_SETTINGS_LAYER } from '@cloudbeaver/core-root';
import {
  createSettingsOverrideResolver,
  SettingsManagerService,
  SettingsProvider,
  SettingsProviderService,
  SettingsResolverService,
} from '@cloudbeaver/core-settings';
import { schema, schemaExtra } from '@cloudbeaver/core-utils';

const defaultSettings = schema.object({
  'plugin.data-import.disabled': schemaExtra.stringedBoolean().default(false),
});

export type DataImportSettings = schema.infer<typeof defaultSettings>;
export type DataImportSettingsSchema = typeof defaultSettings;

export class DataImportSettingsServiceImpl {
  get disabled(): boolean {
    return this.settings.getValue('plugin.data-import.disabled');
  }

  readonly settings: SettingsProvider<typeof defaultSettings>;

  constructor(
    private readonly settingsProviderService: SettingsProviderService,
    private readonly settingsManagerService: SettingsManagerService,
    private readonly settingsResolverService: SettingsResolverService,
  ) {
    // Some settings registered in plugin-data-editor-public-settings & permissions
    this.settings = this.settingsProviderService.createSettings(defaultSettings);

    this.settingsResolverService.addResolver(
      HIGHEST_SETTINGS_LAYER,
      createSettingsOverrideResolver<DataImportSettingsSchema>(this.settingsProviderService.settingsResolver, {
        'plugin.data-import.disabled': {
          key: 'permission.data-editor.import',
          map: value => !value,
        },
      }),
    );

    this.settingsManagerService.registerSettings<typeof defaultSettings>(() => []);
  }
}

export type DataImportSettingsService = DataImportSettingsServiceImpl;

export class DataImportSettingsServiceDI extends Context.Service<DataImportSettingsServiceDI, DataImportSettingsServiceImpl>()(
  '@cloudbeaver/plugin-data-import/DataImportSettingsService#DataImportSettingsService',
) {
  static readonly implementation = DataImportSettingsServiceImpl;

  static readonly dependencies = () => [SettingsProviderService, SettingsManagerService, SettingsResolverService] as const;
  static readonly make: Effect.Effect<
    DataImportSettingsServiceImpl,
    never,
    | Context.Service.Identifier<typeof SettingsProviderService>
    | Context.Service.Identifier<typeof SettingsManagerService>
    | Context.Service.Identifier<typeof SettingsResolverService>
  > = Effect.gen(function* makeDataImportSettingsService() {
    const settingsProviderService = yield* SettingsProviderService;
    const settingsManagerService = yield* SettingsManagerService;
    const settingsResolverService = yield* SettingsResolverService;

    return new DataImportSettingsServiceImpl(settingsProviderService, settingsManagerService, settingsResolverService);
  });
  static readonly layer: Layer.Layer<
    DataImportSettingsServiceDI,
    never,
    | Context.Service.Identifier<typeof SettingsProviderService>
    | Context.Service.Identifier<typeof SettingsManagerService>
    | Context.Service.Identifier<typeof SettingsResolverService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const DataImportSettingsService = DataImportSettingsServiceDI;
