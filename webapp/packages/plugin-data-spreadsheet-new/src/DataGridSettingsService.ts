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
import { DATA_EDITOR_SETTINGS_GROUP } from '@cloudbeaver/plugin-data-viewer';
import { getLocalizedDisplayName } from '@dbeaver/js-helpers';
import { COMMON_LOCALES } from './commonLocales.js';

const NO_FORMAT = 'default';
const OS_FORMAT = '_OS';

function getSupportedLocalesWithRegions() {
  return COMMON_LOCALES.filter(localeCode => {
    try {
      const locale = new Intl.Locale(localeCode);
      return locale.language && locale.region;
    } catch {
      return false;
    }
  });
}

const defaultSettings = schema.object({
  'plugin.data-spreadsheet.hidden': schemaExtra.stringedBoolean().default(false),
  'plugin.data-spreadsheet.showDescriptionInHeader': schemaExtra.stringedBoolean().default(true),
  'plugin.data-spreadsheet.formatLocale': schema.string().default(NO_FORMAT),
});

export type DataGridSettingsSchema = typeof defaultSettings;
export type DataGridSettings = schema.infer<DataGridSettingsSchema>;

export class DataGridSettingsServiceImpl {
  get hidden(): boolean {
    return this.settings.getValue('plugin.data-spreadsheet.hidden');
  }

  get description(): boolean {
    return this.settings.getValue('plugin.data-spreadsheet.showDescriptionInHeader');
  }

  get formatLocale(): string {
    return this.settings.getValue('plugin.data-spreadsheet.formatLocale');
  }

  readonly settings: SettingsProvider<DataGridSettingsSchema>;
  readonly supportedLocales: string[];

  private osLocale: string | null;

  constructor(
    private readonly settingsProviderService: SettingsProviderService,
    private readonly settingsManagerService: SettingsManagerService,
  ) {
    this.supportedLocales = getSupportedLocalesWithRegions();
    this.osLocale = null;
    this.settings = this.settingsProviderService.createSettings(defaultSettings);

    this.registerSettings();
  }

  getFormatLocale(): string | null {
    const setting = this.formatLocale;

    if (setting === NO_FORMAT) {
      return null;
    }

    if (setting === OS_FORMAT) {
      return this.getOrCreateOSLocale();
    }

    return setting;
  }

  private getOrCreateOSLocale(): string {
    if (this.osLocale === null) {
      this.osLocale = new Intl.DateTimeFormat().resolvedOptions().locale;
    }

    return this.osLocale;
  }

  private registerSettings() {
    this.settingsManagerService.registerSettings<typeof defaultSettings>(() => [
      {
        group: DATA_EDITOR_SETTINGS_GROUP,
        key: 'plugin.data-spreadsheet.hidden',
        access: {
          scope: ['role'],
        },
        type: ESettingsValueType.Checkbox,
        name: 'plugin_data_spreadsheet_new_settings_disable',
        description: 'plugin_data_spreadsheet_new_settings_disable_description',
      },
      {
        group: DATA_EDITOR_SETTINGS_GROUP,
        key: 'plugin.data-spreadsheet.showDescriptionInHeader',
        access: {
          scope: ['client'],
        },
        type: ESettingsValueType.Checkbox,
        name: 'plugin_data_spreadsheet_new_settings_description_label',
        description: 'plugin_data_spreadsheet_new_settings_description_label_description',
      },
      {
        group: DATA_EDITOR_SETTINGS_GROUP,
        key: 'plugin.data-spreadsheet.formatLocale',
        access: {
          scope: ['client'],
        },
        type: ESettingsValueType.Select,
        options: [
          { value: NO_FORMAT, name: 'plugin_data_spreadsheet_new_settings_use_locale_formatting_none' },
          { value: OS_FORMAT, name: 'plugin_data_spreadsheet_new_settings_use_locale_formatting_os' },
          ...this.supportedLocales
            .map((locale: string) => ({ value: locale, name: getLocalizedDisplayName(locale) }))
            .sort((a: { value: string; name: string }, b: { value: string; name: string }) => a.name.localeCompare(b.name)),
        ],
        name: 'plugin_data_spreadsheet_new_settings_use_locale_formatting_title',
        description: 'plugin_data_spreadsheet_new_settings_use_locale_formatting_description',
      },
    ]);
  }
}

export type DataGridSettingsService = DataGridSettingsServiceImpl;

export class DataGridSettingsServiceDI extends Context.Service<DataGridSettingsServiceDI, DataGridSettingsServiceImpl>()(
  '@cloudbeaver/plugin-data-spreadsheet-new/DataGridSettingsService#DataGridSettingsService',
) {
  static readonly implementation = DataGridSettingsServiceImpl;

  static readonly dependencies = () => [SettingsProviderService, SettingsManagerService] as const;
  static readonly make: Effect.Effect<
    DataGridSettingsServiceImpl,
    never,
    Context.Service.Identifier<typeof SettingsProviderService> | Context.Service.Identifier<typeof SettingsManagerService>
  > = Effect.gen(function* makeDataGridSettingsService() {
    const settingsProviderService = yield* SettingsProviderService;
    const settingsManagerService = yield* SettingsManagerService;

    return new DataGridSettingsServiceImpl(settingsProviderService, settingsManagerService);
  });
  static readonly layer: Layer.Layer<
    DataGridSettingsServiceDI,
    never,
    Context.Service.Identifier<typeof SettingsProviderService> | Context.Service.Identifier<typeof SettingsManagerService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const DataGridSettingsService = DataGridSettingsServiceDI;
