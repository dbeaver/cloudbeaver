/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Dependency, injectable } from '@cloudbeaver/core-di';
import { ServerSettingsManagerService } from '@cloudbeaver/core-root';
import {
  createSettingsAliasResolver,
  ESettingsValueType,
  ISettingDescription,
  ROOT_SETTINGS_LAYER,
  SettingsManagerService,
  SettingsProvider,
  SettingsProviderService,
  SettingsResolverService,
} from '@cloudbeaver/core-settings';
import { schema, schemaExtra } from '@cloudbeaver/core-utils';

import { SQL_EDITOR_SETTINGS_GROUP } from './SQL_EDITOR_SETTINGS_GROUP';

const TABLE_ALIAS_OPTIONS = ['NONE', 'PLAIN', 'EXTENDED'] as const;

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

const defaultSettings = schema.object({
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
});

export type SqlEditorSettings = schema.infer<typeof defaultSettings>;

@injectable()
export class SqlEditorSettingsService extends Dependency {
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

  readonly settings: SettingsProvider<typeof defaultSettings>;

  constructor(
    private readonly settingsProviderService: SettingsProviderService,
    private readonly settingsManagerService: SettingsManagerService,
    private readonly settingsResolverService: SettingsResolverService,
    private readonly serverSettingsManagerService: ServerSettingsManagerService,
  ) {
    super();
    this.settings = this.settingsProviderService.createSettings(defaultSettings);
    this.settingsResolverService.addResolver(
      ROOT_SETTINGS_LAYER,
      /** @deprecated Use settings instead, will be removed in 23.0.0 */
      createSettingsAliasResolver(this.settingsResolverService, this.settings, {
        'plugin.sql-editor.autoSave': 'core.app.sqlEditor.autoSave',
        'plugin.sql-editor.maxFileSize': 'core.app.sqlEditor.maxFileSize',
        'plugin.sql-editor.disabled': 'core.app.sqlEditor.disabled',
      }),
    );
    this.registerSettings();
  }

  private registerSettings() {
    this.serverSettingsManagerService.setGroupOverride('editors/sqlEditor', SQL_EDITOR_SETTINGS_GROUP);
    this.serverSettingsManagerService.setSettingTransformer(
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

    this.settingsManagerService.registerSettings(this.settings, () => {
      const settings: ISettingDescription<SqlEditorSettings>[] = [
        // {
        //   group: SQL_EDITOR_SETTINGS_GROUP,
        //   key: 'disabled',
        //   type: ESettingsValueType.Checkbox,
        //   name: 'Disable SQL editor',
        // },
        // {
        //   group: SQL_EDITOR_SETTINGS_GROUP,
        //   key: 'maxFileSize',
        //   type: ESettingsValueType.Input,
        //   name: 'Max file size (KB)',
        //   description: 'Max file size for SQL editor in kilobytes',
        // },
        // {
        //   group: SQL_EDITOR_SETTINGS_GROUP,
        //   key: 'autoSave',
        //   type: ESettingsValueType.Checkbox,
        //   name: 'Auto save',
        //   description: 'Auto save SQL editor content',
        // },
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
      return settings;
    });
  }
}
