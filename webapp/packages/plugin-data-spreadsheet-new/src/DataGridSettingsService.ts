/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
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
import { DATA_EDITOR_SETTINGS_GROUP } from '@cloudbeaver/plugin-data-viewer';

const defaultSettings = schema.object({
  'plugin.data-spreadsheet.hidden': schemaExtra.stringedBoolean().default(false),
  'plugin.data-spreadsheet.showDescriptionInHeader': schemaExtra.stringedBoolean().default(true),
  'plugin.data-spreadsheet.useOSFormatting': schema.string().default('default'),
});

export type DataGridSettingsSchema = typeof defaultSettings;
export type DataGridSettings = schema.infer<DataGridSettingsSchema>;

@injectable(() => [SettingsProviderService, SettingsManagerService, SettingsResolverService])
export class DataGridSettingsService {
  get hidden(): boolean {
    return this.settings.getValue('plugin.data-spreadsheet.hidden');
  }

  get description(): boolean {
    return this.settings.getValue('plugin.data-spreadsheet.showDescriptionInHeader');
  }

  get useOSFormatting(): string {
    return this.settings.getValue('plugin.data-spreadsheet.useOSFormatting');
  }

  readonly settings: SettingsProvider<DataGridSettingsSchema>;
  readonly supportedLocales = this.getSupportedLocales();

  constructor(
    private readonly settingsProviderService: SettingsProviderService,
    private readonly settingsManagerService: SettingsManagerService,
    private readonly settingsResolverService: SettingsResolverService,
  ) {
    this.settings = this.settingsProviderService.createSettings(defaultSettings);
    this.settingsResolverService.addResolver(
      ROOT_SETTINGS_LAYER,
      /** @deprecated Use settings instead, will be removed in 23.0.0 */
      createSettingsAliasResolver<DataGridSettingsSchema>(this.settingsProviderService.settingsResolver, {
        'plugin.data-spreadsheet.hidden': 'plugin_data_spreadsheet_new.hidden',
      }),
    );

    this.registerSettings();
  }

  private getSupportedLocales() {
    const codes = [];
    const letters = 'abcdefghijklmnopqrstuvwxyz';

    function isLanguageCodeSupported(code: string | Intl.Locale) {
      const locale = new Intl.Locale(code);
      return locale.maximize().region !== undefined;
    }

    for (let i = 0; i < letters.length; i++) {
      for (let j = 0; j < letters.length; j++) {
        const code = letters[i]! + letters[j]!;
        if (isLanguageCodeSupported(code)) {
          codes.push(code);
        }
      }
    }

    return codes;
  }

  private getLocaleName(localeCode: string) {
    const languageNameInItsOwnLang = new Intl.DisplayNames(localeCode, { type: 'language' });
    const name = languageNameInItsOwnLang.of(localeCode);
    return name && name?.length > 2 ? name.slice(0, 1).toLocaleUpperCase() + name.slice(1) : localeCode;
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
        key: 'plugin.data-spreadsheet.useOSFormatting',
        access: {
          scope: ['client'],
        },
        type: ESettingsValueType.Select,
        options: [
          { value: 'default', name: 'None' },
          { value: '_OS', name: 'plugin_data_spreadsheet_new_settings_use_locale_formatting_os' },
          ...this.supportedLocales
            .map(locale => ({ value: locale, name: this.getLocaleName(locale) }))
            .filter(locale => locale.name.length > 2)
            .sort((a, b) => a.name.localeCompare(b.name)),
        ],
        name: 'plugin_data_spreadsheet_new_settings_use_locale_formatting_title',
        description: 'plugin_data_spreadsheet_new_settings_use_locale_formatting_description',
      },
    ]);
  }
}
