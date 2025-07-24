/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import {
  createSettingsAliasResolver,
  ESettingsValueType,
  ROOT_SETTINGS_LAYER,
  SettingsManagerService,
  SettingsResolverService,
} from '@cloudbeaver/core-settings';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { DATA_EDITOR_SETTINGS_GROUP, type DataViewerSettingsSchema } from '@cloudbeaver/plugin-data-viewer';
import type { DataImportSettingsSchema } from '@cloudbeaver/plugin-data-import';

@injectable()
export class PluginDataEditorPublicSettingsBootstrap extends Bootstrap {
  constructor(
    private readonly settingsManagerService: SettingsManagerService,
    private readonly settingsResolverService: SettingsResolverService,
  ) {
    super();
  }

  override register(): void {
    this.settingsResolverService.addResolver(
      ROOT_SETTINGS_LAYER,
      /** @deprecated Use settings instead, will be removed in 23.0.0 */
      createSettingsAliasResolver<DataViewerSettingsSchema>(this.settingsResolverService, {
        'plugin.data-viewer.disableEdit': 'core.app.dataViewer.disableEdit',
        'plugin.data-viewer.disableCopyData': 'core.app.dataViewer.disableCopyData',
        'plugin.data-viewer.export.disabled': 'plugin.data-export.disabled',
      }),
      /** @deprecated Use settings instead, will be removed in 23.0.0 */
      createSettingsAliasResolver<DataViewerSettingsSchema>(this.settingsResolverService, {
        'plugin.data-viewer.export.disabled': 'plugin_data_export.disabled',
      }),
    );

    this.settingsManagerService.registerSettings<DataViewerSettingsSchema>(() => [
      {
        key: 'plugin.data-viewer.disableEdit',
        access: {
          scope: ['server', 'role'],
        },
        type: ESettingsValueType.Checkbox,
        name: 'settings_data_editor_disable_edit_name',
        description: 'settings_data_editor_disable_edit_description',
        group: DATA_EDITOR_SETTINGS_GROUP,
      },
      {
        key: 'plugin.data-viewer.disableCopyData',
        access: {
          scope: ['server', 'role'],
        },
        type: ESettingsValueType.Checkbox,
        name: 'settings_data_editor_disable_data_copy_name',
        description: 'settings_data_editor_disable_data_copy_description',
        group: DATA_EDITOR_SETTINGS_GROUP,
      },
      {
        group: DATA_EDITOR_SETTINGS_GROUP,
        key: 'plugin.data-viewer.export.disabled',
        type: ESettingsValueType.Checkbox,
        name: 'settings_data_editor_disable_data_export_name',
        description: 'settings_data_editor_disable_data_export_description',
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
        name: 'plugin_data_import_disable_data_import_name',
        description: 'plugin_data_import_disable_data_import_description',
        access: {
          scope: ['server', 'role'],
        },
      },
    ]);
  }
}
