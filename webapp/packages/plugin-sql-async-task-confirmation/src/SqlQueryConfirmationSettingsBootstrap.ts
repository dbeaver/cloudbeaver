/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2019-2025 DBeaver Corp
 *
 * All Rights Reserved
 *
 * NOTICE:  All information contained herein is, and remains
 * the property of DBeaver Corp and its suppliers, if any.
 * The intellectual and technical concepts contained
 * herein are proprietary to DBeaver Corp and its suppliers
 * and may be covered by U.S. and Foreign Patents,
 * patents in process, and are protected by trade secret or copyright law.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from DBeaver Corp.
 */
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { ESettingsValueType, SettingsManagerService, SettingsProvider, SettingsProviderService } from '@cloudbeaver/core-settings';
import { schema } from '@cloudbeaver/core-utils';
import { SQL_EDITOR_SETTINGS_GROUP } from '@cloudbeaver/plugin-sql-editor';

const defaultSettings = schema.object({
  'plugin.sql-editor.executeDropTableQueriesDialog': schema.boolean().default(true),
  'plugin.sql-editor.executeDangerousQueriesDialog': schema.boolean().default(true),
});

export type SqlQueryConfirmationSettingsSchema = typeof defaultSettings;
export type SqlQueryConfirmationSettings = schema.infer<SqlQueryConfirmationSettingsSchema>;

@injectable(() => [SettingsProviderService, SettingsManagerService])
export class SqlQueryConfirmationSettingsBootstrap extends Bootstrap {
  readonly settings: SettingsProvider<SqlQueryConfirmationSettingsSchema>;

  constructor(
    private readonly settingsProviderService: SettingsProviderService,
    private readonly settingsManagerService: SettingsManagerService,
  ) {
    super();
    this.settings = this.settingsProviderService.createSettings(defaultSettings);
  }

  override register(): void {
    this.settingsManagerService.registerSettings<typeof defaultSettings>(() => [
      {
        group: SQL_EDITOR_SETTINGS_GROUP,
        key: 'plugin.sql-editor.executeDropTableQueriesDialog',
        access: {
          scope: ['client'],
        },
        type: ESettingsValueType.Checkbox,
        name: 'plugin_sql_editor_execute_drop_table_queries',
        description: 'plugin_sql_editor_execute_drop_table_queries_description',
      },
      {
        group: SQL_EDITOR_SETTINGS_GROUP,
        key: 'plugin.sql-editor.executeDangerousQueriesDialog',
        access: {
          scope: ['client'],
        },
        type: ESettingsValueType.Checkbox,
        name: 'plugin_sql_editor_execute_dangerous_queries',
        description: 'plugin_sql_editor_execute_dangerous_queries_description',
      },
    ]);
  }
}
