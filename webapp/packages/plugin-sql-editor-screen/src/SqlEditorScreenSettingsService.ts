/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Dependency, injectable } from '@cloudbeaver/core-di';
import { HIGHEST_SETTINGS_LAYER } from '@cloudbeaver/core-root';
import { createSettingsOverrideResolver, SettingsProvider, SettingsProviderService, SettingsResolverService } from '@cloudbeaver/core-settings';
import { schema, schemaExtra } from '@cloudbeaver/core-utils';

const defaultSettings = schema.object({
  'plugin.sql-editor-screen.enabled': schemaExtra.stringedBoolean().default(true),
});

type SqlEditorScreenSettingsSchema = typeof defaultSettings;
export type SqlEditorSettings = schema.infer<SqlEditorScreenSettingsSchema>;

@injectable()
export class SqlEditorScreenSettingsService extends Dependency {
  get enabled(): boolean {
    return this.settings.getValue('plugin.sql-editor-screen.enabled');
  }

  readonly settings: SettingsProvider<typeof defaultSettings>;

  constructor(
    private readonly settingsProviderService: SettingsProviderService,
    private readonly settingsResolverService: SettingsResolverService,
  ) {
    super();
    this.settings = this.settingsProviderService.createSettings(defaultSettings);
    this.settingsResolverService.addResolver(
      HIGHEST_SETTINGS_LAYER,
      createSettingsOverrideResolver<SqlEditorScreenSettingsSchema>(this.settingsProviderService.settingsResolver, {
        'plugin.sql-editor-screen.enabled': {
          key: 'permission.sql.script.execution',
          filter: value => !value,
        },
      }),
    );
  }
}
