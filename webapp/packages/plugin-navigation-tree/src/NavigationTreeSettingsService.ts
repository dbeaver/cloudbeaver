/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed, makeObservable } from 'mobx';

import { Dependency, injectable } from '@cloudbeaver/core-di';
import { ESettingsValueType, SettingsManagerService, SettingsProvider, SettingsProviderService } from '@cloudbeaver/core-settings';
import { schema, schemaExtra } from '@cloudbeaver/core-utils';
import { NAVIGATION_TREE_SETTINGS_GROUP } from '@cloudbeaver/core-navigation-tree';

const defaultSettings = schema.object({
  'plugin.navigation-tree.disabled': schemaExtra.stringedBoolean().default(false),
});

export type NavigationTreeSettings = schema.infer<typeof defaultSettings>;

@injectable()
export class NavigationTreeSettingsService extends Dependency {
  get disabled(): boolean {
    return this.settings.getValue('plugin.navigation-tree.disabled');
  }

  readonly settings: SettingsProvider<typeof defaultSettings>;

  constructor(
    private readonly settingsProviderService: SettingsProviderService,
    private readonly settingsManagerService: SettingsManagerService,
  ) {
    super();
    this.settings = this.settingsProviderService.createSettings(defaultSettings);

    this.registerSettings();

    makeObservable(this, {
      disabled: computed,
    });
  }

  private registerSettings() {
    this.settingsManagerService.registerSettings(this.settings, () => [
      {
        group: NAVIGATION_TREE_SETTINGS_GROUP,
        key: 'plugin.navigation-tree.disabled',
        access: {
          scope: ['role'],
        },
        type: ESettingsValueType.Checkbox,
        name: 'plugin_navigation_tree_settings_disable',
        description: 'plugin_navigation_tree_settings_disable_description',
      },
    ]);
  }
}
