/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, disposeService, Effect, Layer } from '@cloudbeaver/core-di';
import { HIGHEST_SETTINGS_LAYER } from '@cloudbeaver/core-root';
import { createSettingsOverrideResolver, SettingsProvider, SettingsProviderService, SettingsResolverService } from '@cloudbeaver/core-settings';
import { schema, schemaExtra } from '@cloudbeaver/core-utils';

const defaultSettings = schema.object({
  'plugin.sql-editor-screen.enabled': schemaExtra.stringedBoolean().default(true),
});

type SqlEditorScreenSettingsSchema = typeof defaultSettings;
export type SqlEditorSettings = schema.infer<SqlEditorScreenSettingsSchema>;

export class SqlEditorScreenSettingsServiceImpl {
  get enabled(): boolean {
    return this.settings.getValue('plugin.sql-editor-screen.enabled');
  }

  readonly settings: SettingsProvider<typeof defaultSettings>;

  constructor(
    private readonly settingsProviderService: SettingsProviderService,
    private readonly settingsResolverService: SettingsResolverService,
  ) {
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

export type SqlEditorScreenSettingsService = SqlEditorScreenSettingsServiceImpl;

export class SqlEditorScreenSettingsServiceDI extends Context.Service<SqlEditorScreenSettingsServiceDI, SqlEditorScreenSettingsServiceImpl>()(
  '@cloudbeaver/plugin-sql-editor-screen/SqlEditorScreenSettingsService#SqlEditorScreenSettingsService',
) {
  static readonly implementation = SqlEditorScreenSettingsServiceImpl;

  static readonly dependencies = () => [SettingsProviderService, SettingsResolverService] as const;
  static readonly make: Effect.Effect<
    SqlEditorScreenSettingsServiceImpl,
    never,
    Context.Service.Identifier<typeof SettingsProviderService> | Context.Service.Identifier<typeof SettingsResolverService>
  > = Effect.gen(function* makeSqlEditorScreenSettingsService() {
    const settingsProviderService = yield* SettingsProviderService;
    const settingsResolverService = yield* SettingsResolverService;

    return new SqlEditorScreenSettingsServiceImpl(settingsProviderService, settingsResolverService);
  });
  static readonly layer: Layer.Layer<
    SqlEditorScreenSettingsServiceDI,
    never,
    Context.Service.Identifier<typeof SettingsProviderService> | Context.Service.Identifier<typeof SettingsResolverService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const SqlEditorScreenSettingsService = SqlEditorScreenSettingsServiceDI;
