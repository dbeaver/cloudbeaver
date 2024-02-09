/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Dependency, injectable } from '@cloudbeaver/core-di';
import {
  createSettingsAliasResolver,
  ESettingsValueType,
  PluginManagerService,
  PluginSettings,
  SettingsManagerService,
} from '@cloudbeaver/core-plugin';
import { ServerSettingsResolverService, ServerSettingsService } from '@cloudbeaver/core-root';
import { schema } from '@cloudbeaver/core-utils';

import { SQL_EDITOR_SETTINGS_GROUP } from './SQL_EDITOR_SETTINGS_GROUP';

const defaultSettings = schema.object({
  maxFileSize: schema.coerce.number().default(10 * 1024), // kilobyte
  disabled: schema.coerce.boolean().default(false),
  autoSave: schema.coerce.boolean().default(true),
});

const defaultProposalInsertTableSettings = schema.object({
  alias: schema.coerce.boolean().default(true),
});

export type SqlEditorSettings = schema.infer<typeof defaultSettings>;

@injectable()
export class SqlEditorSettingsService extends Dependency {
  readonly settings: PluginSettings<typeof defaultSettings>;
  readonly proposalInsertTableSettings: PluginSettings<typeof defaultProposalInsertTableSettings>;

  constructor(
    private readonly pluginManagerService: PluginManagerService,
    private readonly settingsManagerService: SettingsManagerService,
    private readonly serverSettingsService: ServerSettingsService,
    private readonly serverSettingsResolverService: ServerSettingsResolverService,
  ) {
    super();
    this.settings = this.pluginManagerService.createSettings('sql-editor', 'plugin', defaultSettings);
    this.proposalInsertTableSettings = this.pluginManagerService.createSettings('proposals.insert.table', 'sql', defaultProposalInsertTableSettings);
    this.serverSettingsResolverService.addResolver(
      /** @deprecated Use settings instead, will be removed in 23.0.0 */
      createSettingsAliasResolver(this.serverSettingsService, this.settings, 'core.app.sqlEditor'),
      createSettingsAliasResolver(this.serverSettingsService, this.proposalInsertTableSettings, 'proposals.insert.table'),
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
        group: SQL_EDITOR_SETTINGS_GROUP,
        key: 'alias',
        type: ESettingsValueType.Checkbox,
        name: 'sql_editor_settings_insert_table_aliases_name',
        description: 'sql_editor_settings_insert_table_aliases_desc',
      },
    ]);
  }
}
