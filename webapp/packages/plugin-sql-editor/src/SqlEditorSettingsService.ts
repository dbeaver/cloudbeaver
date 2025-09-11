/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import {
  FEATURE_GIT_ID,
  HIGHEST_SETTINGS_LAYER,
  ServerConfigResource,
  ServerSettingsManagerService,
  SettingsTransformationService,
} from '@cloudbeaver/core-root';
import {
  createSettingsAliasResolver,
  createSettingsOverrideResolver,
  ESettingsValueType,
  type ISettingDescription,
  ROOT_SETTINGS_LAYER,
  SettingsManagerService,
  SettingsProvider,
  SettingsProviderService,
  SettingsResolverService,
} from '@cloudbeaver/core-settings';
import { schema, schemaExtra } from '@cloudbeaver/core-utils';

import { SQL_EDITOR_SETTINGS_GROUP } from './SQL_EDITOR_SETTINGS_GROUP.js';

const TABLE_ALIAS_OPTIONS = ['NONE', 'PLAIN', 'EXTENDED'] as const;
const ASSISTANT_MODE_OPTIONS = ['DEFAULT', 'NEW', 'COMBINE'] as const;

const TABLE_ALIAS_SETTING_OPTIONS = [
  {
    value: 'NONE',
    name: 'ui_disable',
  },
  {
    value: 'PLAIN',
    name: 'my_table mt',
  },
  {
    value: 'EXTENDED',
    name: 'my_table AS mt',
  },
];

const ASSISTANT_MODE_OPTIONS_LOCALIZED = [
  { value: 'DEFAULT', name: 'sql_editor_settings_content_assistant_experimental_mode_default' },
  { value: 'NEW', name: 'sql_editor_settings_content_assistant_experimental_mode_new' },
];

const defaultSettings = schema.object({
  'plugin.sql-editor.script.executionEnabled': schemaExtra.stringedBoolean().default(true),
  'plugin.sql-editor.maxFileSize': schema.coerce.number().default(10 * 1024), // kilobyte
  'plugin.sql-editor.disabled': schemaExtra.stringedBoolean().default(false),
  'plugin.sql-editor.autoSave': schemaExtra.stringedBoolean().default(true),
  'sql.proposals.insert.table.alias': schema.coerce
    .string()
    .transform(value => {
      switch (value) {
        case 'false':
          return 'NONE';
        case 'true':
          return 'PLAIN';
        default:
          return value;
      }
    })
    .pipe(schema.enum(TABLE_ALIAS_OPTIONS))
    .default('PLAIN'),
  'SQLEditor.ContentAssistant.proposals.long.name': schema.coerce.boolean().default(false),
  'SQLEditor.ContentAssistant.experimental.mode': schema.coerce
    .string()
    .pipe(schema.enum(ASSISTANT_MODE_OPTIONS))
    .transform(value => {
      switch (value) {
        case 'DEFAULT':
          return 'DEFAULT';
        default:
          return 'NEW';
      }
    })
    .default('NEW'),
});

type SqlEditorSettingsSchema = typeof defaultSettings;
export type SqlEditorSettings = schema.infer<SqlEditorSettingsSchema>;

@injectable(() => [
  SettingsProviderService,
  SettingsManagerService,
  SettingsResolverService,
  SettingsTransformationService,
  ServerSettingsManagerService,
  ServerConfigResource,
])
export class SqlEditorSettingsService {
  get scriptExecutionEnabled(): boolean {
    return this.settings.getValue('plugin.sql-editor.script.executionEnabled');
  }
  get maxFileSize(): number {
    return this.settings.getValue('plugin.sql-editor.maxFileSize');
  }

  get disabled(): boolean {
    return this.settings.getValue('plugin.sql-editor.disabled');
  }

  get autoSave(): boolean {
    return this.settings.getValue('plugin.sql-editor.autoSave');
  }

  get insertTableAlias(): schema.infer<typeof defaultSettings>['sql.proposals.insert.table.alias'] {
    return this.settings.getValue('sql.proposals.insert.table.alias');
  }

  get longNameProposals(): boolean {
    return this.settings.getValue('SQLEditor.ContentAssistant.proposals.long.name');
  }

  readonly settings: SettingsProvider<typeof defaultSettings>;

  constructor(
    private readonly settingsProviderService: SettingsProviderService,
    private readonly settingsManagerService: SettingsManagerService,
    private readonly settingsResolverService: SettingsResolverService,
    private readonly settingsTransformationService: SettingsTransformationService,
    private readonly serverSettingsManagerService: ServerSettingsManagerService,
    private readonly serverConfigResource: ServerConfigResource,
  ) {
    this.settings = this.settingsProviderService.createSettings(defaultSettings);
    this.settingsResolverService.addResolver(
      ROOT_SETTINGS_LAYER,
      /** @deprecated Use settings instead, will be removed in 23.0.0 */
      createSettingsAliasResolver<SqlEditorSettingsSchema>(this.settingsProviderService.settingsResolver, {
        'plugin.sql-editor.autoSave': 'core.app.sqlEditor.autoSave',
        'plugin.sql-editor.maxFileSize': 'core.app.sqlEditor.maxFileSize',
        'plugin.sql-editor.disabled': 'core.app.sqlEditor.disabled',
      }),
    );
    this.settingsResolverService.addResolver(
      HIGHEST_SETTINGS_LAYER,
      createSettingsOverrideResolver<SqlEditorSettingsSchema>(this.settingsProviderService.settingsResolver, {
        'plugin.sql-editor.script.executionEnabled': {
          key: 'permission.sql.script.execution',
          filter: value => !value,
        },
      }),
    );
    this.registerSettings();
  }

  private registerSettings() {
    this.settingsTransformationService.setGroupOverride('editors/sqlEditor', SQL_EDITOR_SETTINGS_GROUP);
    this.settingsTransformationService.setSettingTransformer(
      'sql.proposals.insert.table.alias',
      setting =>
        ({
          ...setting,
          group: SQL_EDITOR_SETTINGS_GROUP,
          name: 'sql_editor_settings_insert_table_aliases_name',
          description: 'sql_editor_settings_insert_table_aliases_desc',
          options: [...(setting.options?.filter(option => !TABLE_ALIAS_OPTIONS.includes(option.value as any)) || []), ...TABLE_ALIAS_SETTING_OPTIONS],
        }) as ISettingDescription<SqlEditorSettings>,
    );
    this.settingsTransformationService.setSettingTransformer(
      'SQLEditor.ContentAssistant.experimental.mode',
      setting =>
        ({
          ...setting,
          group: SQL_EDITOR_SETTINGS_GROUP,
          name: 'sql_editor_settings_content_assistant_experimental_mode_name',
          description: 'sql_editor_settings_content_assistant_experimental_mode_desc',
          options: ASSISTANT_MODE_OPTIONS_LOCALIZED,
        }) as ISettingDescription<SqlEditorSettings>,
    );

    this.settingsManagerService.registerSettings<typeof defaultSettings>(() => {
      const settings: ISettingDescription<SqlEditorSettings>[] = [
        {
          group: SQL_EDITOR_SETTINGS_GROUP,
          key: 'plugin.sql-editor.disabled',
          access: {
            scope: ['role'],
          },
          type: ESettingsValueType.Checkbox,
          name: 'plugin_sql_editor_settings_disable',
          description: 'plugin_sql_editor_settings_disable_description',
        },
        {
          group: SQL_EDITOR_SETTINGS_GROUP,
          key: 'plugin.sql-editor.maxFileSize',
          access: {
            scope: ['client', 'server'],
          },
          type: ESettingsValueType.Input,
          name: 'plugin_sql_editor_settings_import_max_size',
          description: 'plugin_sql_editor_settings_import_max_size_description',
        },
        {
          group: SQL_EDITOR_SETTINGS_GROUP,
          key: 'plugin.sql-editor.autoSave',
          access: {
            scope: ['client', 'server'],
          },
          type: ESettingsValueType.Checkbox,
          name: 'plugin_sql_editor_settings_auto_save',
          description: this.serverConfigResource.isFeatureEnabled(FEATURE_GIT_ID, true)
            ? 'plugin_sql_editor_settings_auto_save_description_git_integration'
            : 'plugin_sql_editor_settings_auto_save_description',
        },
      ];

      if (!this.serverSettingsManagerService.providedSettings.has('sql.proposals.insert.table.alias')) {
        settings.push({
          key: 'sql.proposals.insert.table.alias',
          access: {
            scope: ['server', 'client'],
          },
          group: SQL_EDITOR_SETTINGS_GROUP,
          type: ESettingsValueType.Select,
          name: 'sql_editor_settings_insert_table_aliases_name',
          description: 'sql_editor_settings_insert_table_aliases_desc',
          options: TABLE_ALIAS_SETTING_OPTIONS,
        });
      }
      if (!this.serverSettingsManagerService.providedSettings.has('SQLEditor.ContentAssistant.experimental.mode')) {
        settings.push({
          key: 'SQLEditor.ContentAssistant.experimental.mode',
          access: {
            scope: ['server', 'client'],
          },
          group: SQL_EDITOR_SETTINGS_GROUP,
          type: ESettingsValueType.Select,
          name: 'sql_editor_settings_content_assistant_experimental_mode_name',
          options: ASSISTANT_MODE_OPTIONS_LOCALIZED,
        });
      }
      return settings;
    });
  }
}
