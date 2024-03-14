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

import { DATA_EDITOR_SETTINGS_GROUP } from './DATA_EDITOR_SETTINGS_GROUP';

const defaultSettings = schema.object({
  disableEdit: schemaExtra.stringedBoolean().default(false),
  disableCopyData: schemaExtra.stringedBoolean().default(false),
  fetchMin: schema.coerce.number().min(10).default(100),
  fetchMax: schema.coerce.number().min(10).default(5000),
  fetchDefault: schema.coerce.number().min(10).default(200),
});

export type DataViewerSettings = schema.infer<typeof defaultSettings>;

@injectable()
export class DataViewerSettingsService extends Dependency {
  readonly settings: SettingsProvider<typeof defaultSettings>;

  constructor(
    private readonly settingsProviderService: SettingsProviderService,
    private readonly settingsManagerService: SettingsManagerService,
    private readonly serverSettingsService: ServerSettingsService,
    private readonly settingsResolverService: SettingsResolverService,
  ) {
    super();
    this.settings = this.settingsProviderService.createSettings(defaultSettings, 'plugin', 'data-viewer');
    this.settingsResolverService.addResolver(
      ROOT_SETTINGS_LAYER,
      /** @deprecated Use settings instead, will be removed in 23.0.0 */
      createSettingsAliasResolver(this.serverSettingsService, this.settings, 'core.app.dataViewer'),
    );

    this.registerSettings();
  }

  getMaxFetchSize(): number {
    return this.settings.getValue('fetchMax');
  }

  getMinFetchSize(): number {
    return this.settings.getValue('fetchMin');
  }

  getDefaultFetchSize(): number {
    return this.settings.getValue('fetchDefault');
  }

  getDefaultRowsCount(count?: number): number {
    if (typeof count === 'number' && Number.isNaN(count)) {
      count = 0;
    }
    return count !== undefined ? Math.max(this.getMinFetchSize(), Math.min(count, this.getMaxFetchSize())) : this.getDefaultFetchSize();
  }

  private registerSettings() {
    this.settingsManagerService.registerSettings(this.settings.scope, this.settings.schema, () => [
      {
        key: 'disableEdit',
        access: {
          accessor: ['server'],
        },
        type: ESettingsValueType.Checkbox,
        name: 'settings_data_editor_disable_edit_name',
        description: 'settings_data_editor_disable_edit_description',
        group: DATA_EDITOR_SETTINGS_GROUP,
      },
      {
        key: 'disableCopyData',
        access: {
          accessor: ['server'],
        },
        type: ESettingsValueType.Checkbox,
        name: 'settings_data_editor_disable_data_copy_name',
        description: 'settings_data_editor_disable_data_copy_description',
        group: DATA_EDITOR_SETTINGS_GROUP,
      },
      {
        key: 'fetchMin',
        access: {
          accessor: ['server'],
        },
        type: ESettingsValueType.Input,
        name: 'settings_data_editor_fetch_min_name',
        description: 'settings_data_editor_fetch_min_description',
        group: DATA_EDITOR_SETTINGS_GROUP,
      },
      {
        key: 'fetchMax',
        access: {
          accessor: ['server'],
        },
        type: ESettingsValueType.Input,
        name: 'settings_data_editor_fetch_max_name',
        description: 'settings_data_editor_fetch_max_description',
        group: DATA_EDITOR_SETTINGS_GROUP,
      },
      {
        key: 'fetchDefault',
        access: {
          accessor: ['server'],
        },
        type: ESettingsValueType.Input,
        name: 'settings_data_editor_fetch_default_name',
        description: 'settings_data_editor_fetch_default_description',
        group: DATA_EDITOR_SETTINGS_GROUP,
      },
    ]);
  }
}
