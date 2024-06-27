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

import { DATA_EDITOR_SETTINGS_GROUP } from './DATA_EDITOR_SETTINGS_GROUP';

const FETCH_MIN = 10;
const FETCH_MAX = 5000;
const DEFAULT_FETCH_SIZE = 200;

const defaultSettings = schema.object({
  'plugin.data-viewer.disableEdit': schemaExtra.stringedBoolean().default(false),
  'plugin.data-viewer.disableCopyData': schemaExtra.stringedBoolean().default(false),
  'plugin.data-viewer.disableDownload': schemaExtra.stringedBoolean().default(false),
  'plugin.data-viewer.fetchMin': schema.coerce.number().min(FETCH_MIN).default(DEFAULT_FETCH_SIZE),
  'plugin.data-viewer.fetchMax': schema.coerce.number().min(FETCH_MIN).default(FETCH_MAX),
  'resultset.maxrows': schema.coerce.number().min(FETCH_MIN).max(FETCH_MAX).default(DEFAULT_FETCH_SIZE),
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

  get disableDownload(): boolean {
    return this.settings.getValue('plugin.data-viewer.disableDownload');
  }

  get maxFetchSize(): number {
    return this.settings.getValue('plugin.data-viewer.fetchMax');
  }

  get minFetchSize(): number {
    return this.settings.getValue('plugin.data-viewer.fetchMin');
  }

  get defaultFetchSize(): number {
    return this.settings.getValue('resultset.maxrows');
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
        'plugin.data-viewer.disableEdit': 'core.app.dataViewer.disableEdit',
        'plugin.data-viewer.disableCopyData': 'core.app.dataViewer.disableCopyData',
        'plugin.data-viewer.fetchMin': 'core.app.dataViewer.fetchMin',
        'plugin.data-viewer.fetchMax': 'core.app.dataViewer.fetchMax',
        'resultset.maxrows': 'core.app.dataViewer.fetchDefault',
      }),
      /** @deprecated Use settings instead, will be removed in 25.0.0 */
      createSettingsAliasResolver(this.settingsResolverService, this.settings, {
        'resultset.maxrows': 'plugin.data-viewer.fetchDefault',
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
    this.serverSettingsManagerService.setSettingTransformer(
      'resultset.maxrows',
      setting =>
        ({
          ...setting,
          name: 'settings_data_editor_fetch_default_name',
          description: 'settings_data_editor_fetch_default_description',
          group: DATA_EDITOR_SETTINGS_GROUP,
        }) as ISettingDescription<DataViewerSettings>,
    );

    this.settingsManagerService.registerSettings(this.settings, () => {
      const settings: ISettingDescription<DataViewerSettings>[] = [
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
          key: 'plugin.data-viewer.disableDownload',
          access: {
            scope: ['server'],
          },
          type: ESettingsValueType.Checkbox,
          name: 'settings_data_editor_disable_data_download_name',
          description: 'settings_data_editor_disable_data_download_description',
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
      ];

      if (!this.serverSettingsManagerService.providedSettings.has('resultset.maxrows')) {
        settings.push({
          key: 'resultset.maxrows',
          access: {
            scope: ['server'],
          },
          type: ESettingsValueType.Input,
          name: 'settings_data_editor_fetch_default_name',
          description: 'settings_data_editor_fetch_default_description',
          group: DATA_EDITOR_SETTINGS_GROUP,
        });
      }

      return settings;
    });
  }
}
