/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Dependency, injectable } from '@cloudbeaver/core-di';
import { ESettingsValueType, SettingsManagerService, SettingsProvider, SettingsProviderService } from '@cloudbeaver/core-settings';
import { schema, schemaExtra } from '@cloudbeaver/core-utils';
import { NAVIGATION_TABS_GROUP } from './NAVIGATION_TABS_GROUP.js';

const settings = schema.object({
  'plugin.navigation-tabs.multipleRows': schemaExtra.stringedBoolean().default(false),
});

type Settings = typeof settings;

@injectable()
export class NavigationTabsSettingsService extends Dependency {
  readonly settings: SettingsProvider<Settings>;

  get hasMultipleRows(): boolean {
    return this.settings.getValue('plugin.navigation-tabs.multipleRows');
  }

  constructor(
    private readonly settingsProviderService: SettingsProviderService,
    private readonly settingsManagerService: SettingsManagerService,
  ) {
    super();
    this.settings = this.settingsProviderService.createSettings(settings);

    this.registerSettings();
  }

  private registerSettings() {
    this.settingsManagerService.registerSettings(this.settings, () => [
      {
        group: NAVIGATION_TABS_GROUP,
        key: 'plugin.navigation-tabs.multipleRows',
        access: {
          scope: ['client'],
        },
        type: ESettingsValueType.Checkbox,
        name: 'plugin_navigation_tabs_multiple_rows',
        description: 'plugin_navigation_tabs_multiple_rows_description',
      },
    ]);
  }
}
