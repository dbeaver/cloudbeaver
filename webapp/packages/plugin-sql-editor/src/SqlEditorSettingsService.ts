/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Dependency, injectable } from '@cloudbeaver/core-di';
import { ServerSettingsService } from '@cloudbeaver/core-root';
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

import { SQL_EDITOR_SETTINGS_GROUP } from './SQL_EDITOR_SETTINGS_GROUP';

const defaultSettings = schema.object({
  maxFileSize: schema.coerce.number().default(10 * 1024), // kilobyte
  disabled: schemaExtra.stringedBoolean().default(false),
  autoSave: schemaExtra.stringedBoolean().default(true),
});

const defaultProposalInsertTableSettings = schema.object({
  alias: schemaExtra.stringedBoolean().default(true),
});

export type SqlEditorSettings = schema.infer<typeof defaultSettings>;

@injectable()
export class SqlEditorSettingsService extends Dependency {
  readonly settings: SettingsProvider<typeof defaultSettings>;
  readonly proposalInsertTableSettings: SettingsProvider<typeof defaultProposalInsertTableSettings>;

  constructor(
    private readonly settingsProviderService: SettingsProviderService,
    private readonly settingsManagerService: SettingsManagerService,
    private readonly serverSettingsService: ServerSettingsService,
    private readonly settingsResolverService: SettingsResolverService,
  ) {
    super();
    this.settings = this.settingsProviderService.createSettings(defaultSettings, 'plugin', 'sql-editor');
    this.proposalInsertTableSettings = this.settingsProviderService.createSettings(defaultProposalInsertTableSettings, 'sql.proposals.insert.table');
    this.settingsResolverService.addResolver(
      ROOT_SETTINGS_LAYER,
      /** @deprecated Use settings instead, will be removed in 23.0.0 */
      createSettingsAliasResolver(this.serverSettingsService, this.settings, 'core.app.sqlEditor'),
    );
    this.registerSettings();
  }

  private registerSettings() {
    this.settingsManagerService.registerSettings(this.settings, () => [
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
    ]);

    this.settingsManagerService.registerSettings(this.proposalInsertTableSettings, () => [
      {
        key: 'alias',
        access: {
          accessor: ['server', 'client'],
        },
        group: SQL_EDITOR_SETTINGS_GROUP,
        type: ESettingsValueType.Checkbox,
        name: 'sql_editor_settings_insert_table_aliases_name',
        description: 'sql_editor_settings_insert_table_aliases_desc',
      },
    ]);
  }
}
