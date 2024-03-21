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
  'plugin.data-viewer.disableEdit': schemaExtra.stringedBoolean().default(false),
  'plugin.data-viewer.disableCopyData': schemaExtra.stringedBoolean().default(false),
  'plugin.data-viewer.fetchMin': schema.coerce.number().min(10).default(100),
  'plugin.data-viewer.fetchMax': schema.coerce.number().min(10).default(5000),
  'plugin.data-viewer.fetchDefault': schema.coerce.number().min(10).default(200),
});

export type DataViewerSettings = schema.infer<typeof defaultSettings>;

@injectable()
export class DataViewerSettingsService extends Dependency {
  get disableEdit(): boolean {
    return this.settings.getValue('plugin.data-viewer.disableEdit');
  }

  get disableCopyData(): boolean {
    return this.settings.getValue('plugin.data-viewer.disableCopyData');
  }

  get maxFetchSize(): number {
    return this.settings.getValue('plugin.data-viewer.fetchMax');
  }

  get minFetchSize(): number {
    return this.settings.getValue('plugin.data-viewer.fetchMin');
  }

  get defaultFetchSize(): number {
    return this.settings.getValue('plugin.data-viewer.fetchDefault');
  }

  readonly settings: SettingsProvider<typeof defaultSettings>;

  constructor(
    private readonly settingsProviderService: SettingsProviderService,
    private readonly settingsManagerService: SettingsManagerService,
    private readonly serverSettingsService: ServerSettingsService,
    private readonly settingsResolverService: SettingsResolverService,
  ) {
    super();
    this.settings = this.settingsProviderService.createSettings(defaultSettings);
    this.settingsResolverService.addResolver(
      ROOT_SETTINGS_LAYER,
      /** @deprecated Use settings instead, will be removed in 23.0.0 */
      createSettingsAliasResolver(this.serverSettingsService, this.settings, {
        'plugin.data-viewer.disableEdit': 'core.app.dataViewer.disableEdit',
        'plugin.data-viewer.disableCopyData': 'core.app.dataViewer.disableCopyData',
        'plugin.data-viewer.fetchMin': 'core.app.dataViewer.fetchMin',
        'plugin.data-viewer.fetchMax': 'core.app.dataViewer.fetchMax',
        'plugin.data-viewer.fetchDefault': 'core.app.dataViewer.fetchDefault',
      }),
    );

    this.registerSettings();
  }

  getDefaultRowsCount(count?: number): number {
    if (typeof count === 'number' && Number.isNaN(count)) {
      count = 0;
    }
    return count !== undefined ? Math.max(this.minFetchSize, Math.min(count, this.maxFetchSize)) : this.defaultFetchSize;
  }

  private registerSettings() {
    this.settingsManagerService.registerSettings(this.settings, () => [
      {
        key: 'plugin.data-viewer.disableEdit',
        access: {
          scope: ['server'],
        },
        type: ESettingsValueType.Checkbox,
        name: 'settings_data_editor_disable_edit_name',
        description: 'settings_data_editor_disable_edit_description',
        group: DATA_EDITOR_SETTINGS_GROUP,
      },
      {
        key: 'plugin.data-viewer.disableCopyData',
        access: {
          scope: ['server'],
        },
        type: ESettingsValueType.Checkbox,
        name: 'settings_data_editor_disable_data_copy_name',
        description: 'settings_data_editor_disable_data_copy_description',
        group: DATA_EDITOR_SETTINGS_GROUP,
      },
      {
        key: 'plugin.data-viewer.fetchMin',
        access: {
          scope: ['server'],
        },
        type: ESettingsValueType.Input,
        name: 'settings_data_editor_fetch_min_name',
        description: 'settings_data_editor_fetch_min_description',
        group: DATA_EDITOR_SETTINGS_GROUP,
      },
      {
        key: 'plugin.data-viewer.fetchMax',
        access: {
          scope: ['server'],
        },
        type: ESettingsValueType.Input,
        name: 'settings_data_editor_fetch_max_name',
        description: 'settings_data_editor_fetch_max_description',
        group: DATA_EDITOR_SETTINGS_GROUP,
      },
      {
        key: 'plugin.data-viewer.fetchDefault',
        access: {
          scope: ['server'],
        },
        type: ESettingsValueType.Input,
        name: 'settings_data_editor_fetch_default_name',
        description: 'settings_data_editor_fetch_default_description',
        group: DATA_EDITOR_SETTINGS_GROUP,
      },
    ]);
  }
}
