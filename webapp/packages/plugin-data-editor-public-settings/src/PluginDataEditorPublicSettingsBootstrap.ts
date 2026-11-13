/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { ESettingsValueType, SettingsManagerService } from '@cloudbeaver/core-settings';
import type { DataImportSettingsSchema } from '@cloudbeaver/plugin-data-import';
import { DATA_EDITOR_SETTINGS_GROUP, type DataViewerSettingsSchema } from '@cloudbeaver/plugin-data-viewer';

export class PluginDataEditorPublicSettingsBootstrapImpl extends Bootstrap {
  constructor(private readonly settingsManagerService: SettingsManagerService) {
    super();
  }

  override register(): void {
    this.settingsManagerService.registerSettings<DataViewerSettingsSchema>(() => [
      {
        key: 'plugin.data-viewer.disableEdit',
        access: {
          scope: ['server', 'role'],
        },
        type: ESettingsValueType.Checkbox,
        name: 'data_editor_public_settings_disable_edit_name',
        description: 'data_editor_public_settings_disable_edit_description',
        group: DATA_EDITOR_SETTINGS_GROUP,
      },
      {
        key: 'plugin.data-viewer.disableCopyData',
        access: {
          scope: ['server', 'role'],
        },
        type: ESettingsValueType.Checkbox,
        name: 'data_editor_public_settings_disable_data_copy_name',
        description: 'data_editor_public_settings_disable_data_copy_description',
        group: DATA_EDITOR_SETTINGS_GROUP,
      },
      {
        group: DATA_EDITOR_SETTINGS_GROUP,
        key: 'plugin.data-viewer.export.disabled',
        type: ESettingsValueType.Checkbox,
        name: 'data_editor_public_settings_disable_data_export_name',
        description: 'data_editor_public_settings_disable_data_export_description',
        access: {
          scope: ['server', 'role'],
        },
      },
    ]);

    this.settingsManagerService.registerSettings<DataImportSettingsSchema>(() => [
      {
        group: DATA_EDITOR_SETTINGS_GROUP,
        key: 'plugin.data-import.disabled',
        type: ESettingsValueType.Checkbox,
        name: 'data_editor_public_settings_disable_data_import_name',
        description: 'data_editor_public_settings_disable_data_import_description',
        access: {
          scope: ['server', 'role'],
        },
      },
    ]);
  }
}

export type PluginDataEditorPublicSettingsBootstrap = PluginDataEditorPublicSettingsBootstrapImpl;

export class PluginDataEditorPublicSettingsBootstrapDI extends Context.Service<
  PluginDataEditorPublicSettingsBootstrapDI,
  PluginDataEditorPublicSettingsBootstrapImpl
>()('@cloudbeaver/plugin-data-editor-public-settings/PluginDataEditorPublicSettingsBootstrap#PluginDataEditorPublicSettingsBootstrap') {
  static readonly implementation = PluginDataEditorPublicSettingsBootstrapImpl;

  static readonly dependencies = () => [SettingsManagerService] as const;
  static readonly make: Effect.Effect<PluginDataEditorPublicSettingsBootstrapImpl, never, Context.Service.Identifier<typeof SettingsManagerService>> =
    Effect.gen(function* makePluginDataEditorPublicSettingsBootstrap() {
      const settingsManagerService = yield* SettingsManagerService;

      return new PluginDataEditorPublicSettingsBootstrapImpl(settingsManagerService);
    });
  static readonly layer: Layer.Layer<PluginDataEditorPublicSettingsBootstrapDI, never, Context.Service.Identifier<typeof SettingsManagerService>> =
    Layer.effect(
      this,
      Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
    );
}

export const PluginDataEditorPublicSettingsBootstrap = PluginDataEditorPublicSettingsBootstrapDI;
