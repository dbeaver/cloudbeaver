/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, disposeService, Effect, Layer } from '@cloudbeaver/core-di';
import { HIGHEST_SETTINGS_LAYER, ServerSettingsManagerService, SettingsTransformationService } from '@cloudbeaver/core-root';
import {
  createSettingsOverrideResolver,
  ESettingsValueType,
  type ISettingDescription,
  SettingsManagerService,
  SettingsProvider,
  SettingsProviderService,
  SettingsResolverService,
} from '@cloudbeaver/core-settings';
import { schema, schemaExtra } from '@cloudbeaver/core-utils';
import { DATA_EDITOR_SETTINGS_GROUP } from './DATA_EDITOR_SETTINGS_GROUP.js';

const FETCH_MIN = 10;
const FETCH_MAX = 5000;
const DEFAULT_FETCH_SIZE = 200;

const defaultSettings = schema.object({
  'plugin.data-viewer.disableEdit': schemaExtra.stringedBoolean().default(false),
  'plugin.data-viewer.disableCopyData': schemaExtra.stringedBoolean().default(false),
  'plugin.data-viewer.fetchMax': schema.coerce.number().min(FETCH_MIN).default(FETCH_MAX),
  'resultset.maxrows': schema.coerce.number().min(FETCH_MIN).max(FETCH_MAX).default(DEFAULT_FETCH_SIZE),
  'plugin.data-viewer.export.disabled': schemaExtra.stringedBoolean().default(false),
});

export type DataViewerSettingsSchema = typeof defaultSettings;
export type DataViewerSettings = schema.infer<DataViewerSettingsSchema>;

export class DataViewerSettingsServiceImpl {
  get disableEdit(): boolean {
    return this.settings.getValue('plugin.data-viewer.disableEdit');
  }

  get disableCopyData(): boolean {
    return this.settings.getValue('plugin.data-viewer.disableCopyData');
  }

  get disableExportData(): boolean {
    return this.settings.getValue('plugin.data-viewer.export.disabled');
  }

  get maxFetchSize(): number {
    return this.settings.getValue('plugin.data-viewer.fetchMax');
  }

  get minFetchSize(): number {
    return FETCH_MIN;
  }

  get defaultFetchSize(): number {
    return this.settings.getValue('resultset.maxrows');
  }

  readonly settings: SettingsProvider<DataViewerSettingsSchema>;

  constructor(
    private readonly settingsProviderService: SettingsProviderService,
    private readonly settingsManagerService: SettingsManagerService,
    private readonly settingsResolverService: SettingsResolverService,
    private readonly settingsTransformationService: SettingsTransformationService,
    private readonly serverSettingsManagerService: ServerSettingsManagerService,
  ) {
    // Some settings registered in plugin-data-editor-public-settings & permissions
    this.settings = this.settingsProviderService.createSettings(defaultSettings);

    this.settingsResolverService.addResolver(
      HIGHEST_SETTINGS_LAYER,
      createSettingsOverrideResolver<DataViewerSettingsSchema>(this.settingsProviderService.settingsResolver, {
        'plugin.data-viewer.disableEdit': {
          key: 'permission.data-editor.editing',
          map: value => !value,
        },
        'plugin.data-viewer.disableCopyData': {
          key: 'permission.data-editor.copy',
          map: value => !value,
        },
        'plugin.data-viewer.export.disabled': {
          key: 'permission.data-editor.export',
          map: value => !value,
        },
      }),
    );

    this.registerSettings();
  }

  getDefaultRowsCount(count?: number): number {
    if (typeof count === 'number' && Number.isNaN(count)) {
      count = 0;
    }

    return count !== undefined ? Math.max(this.minFetchSize, Math.min(count, this.maxFetchSize)) : this.defaultFetchSize;
  }

  private registerSettings() {
    this.settingsTransformationService.setSettingTransformer(
      'resultset.maxrows',
      setting =>
        ({
          ...setting,
          name: 'settings_data_editor_fetch_default_name',
          description: 'settings_data_editor_fetch_default_description',
          group: DATA_EDITOR_SETTINGS_GROUP,
        }) as ISettingDescription<DataViewerSettings>,
    );

    this.settingsManagerService.registerSettings<typeof defaultSettings>(() => {
      const settings: ISettingDescription<DataViewerSettings>[] = [
        {
          key: 'plugin.data-viewer.fetchMax',
          access: {
            scope: ['server', 'role'],
          },
          type: ESettingsValueType.Input,
          name: 'settings_data_editor_fetch_max_name',
          description: 'settings_data_editor_fetch_max_description',
          group: DATA_EDITOR_SETTINGS_GROUP,
        },
      ];

      if (!this.serverSettingsManagerService.providedSettings.has('resultset.maxrows')) {
        settings.push({
          key: 'resultset.maxrows',
          access: {
            scope: ['server', 'client'],
          },
          type: ESettingsValueType.Input,
          name: 'settings_data_editor_fetch_default_name',
          description: 'settings_data_editor_fetch_default_description',
          group: DATA_EDITOR_SETTINGS_GROUP,
        });
      }

      return settings;
    });
  }
}

export type DataViewerSettingsService = DataViewerSettingsServiceImpl;

export class DataViewerSettingsServiceDI extends Context.Service<DataViewerSettingsServiceDI, DataViewerSettingsServiceImpl>()(
  '@cloudbeaver/plugin-data-viewer/DataViewerSettingsService#DataViewerSettingsService',
) {
  static readonly implementation = DataViewerSettingsServiceImpl;

  static readonly dependencies = () =>
    [SettingsProviderService, SettingsManagerService, SettingsResolverService, SettingsTransformationService, ServerSettingsManagerService] as const;
  static readonly make: Effect.Effect<
    DataViewerSettingsServiceImpl,
    never,
    | Context.Service.Identifier<typeof SettingsProviderService>
    | Context.Service.Identifier<typeof SettingsManagerService>
    | Context.Service.Identifier<typeof SettingsResolverService>
    | Context.Service.Identifier<typeof SettingsTransformationService>
    | Context.Service.Identifier<typeof ServerSettingsManagerService>
  > = Effect.gen(function* makeDataViewerSettingsService() {
    const settingsProviderService = yield* SettingsProviderService;
    const settingsManagerService = yield* SettingsManagerService;
    const settingsResolverService = yield* SettingsResolverService;
    const settingsTransformationService = yield* SettingsTransformationService;
    const serverSettingsManagerService = yield* ServerSettingsManagerService;

    return new DataViewerSettingsServiceImpl(
      settingsProviderService,
      settingsManagerService,
      settingsResolverService,
      settingsTransformationService,
      serverSettingsManagerService,
    );
  });
  static readonly layer: Layer.Layer<
    DataViewerSettingsServiceDI,
    never,
    | Context.Service.Identifier<typeof SettingsProviderService>
    | Context.Service.Identifier<typeof SettingsManagerService>
    | Context.Service.Identifier<typeof SettingsResolverService>
    | Context.Service.Identifier<typeof SettingsTransformationService>
    | Context.Service.Identifier<typeof ServerSettingsManagerService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const DataViewerSettingsService = DataViewerSettingsServiceDI;
