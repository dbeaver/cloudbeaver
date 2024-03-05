/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed, makeObservable } from 'mobx';

import { Dependency, injectable } from '@cloudbeaver/core-di';
import { PluginManagerService, PluginSettings, SettingsManagerService } from '@cloudbeaver/core-plugin';
import { schema } from '@cloudbeaver/core-utils';

const defaultSettings = schema.object({
  disabled: schema.coerce.boolean().default(false),
});

export type NavigationTreeSettings = schema.infer<typeof defaultSettings>;

@injectable()
export class NavigationTreeSettingsService extends Dependency {
  get disabled(): boolean {
    return this.settings.getValue('disabled');
  }

  readonly settings: PluginSettings<typeof defaultSettings>;

  constructor(private readonly pluginManagerService: PluginManagerService, private readonly settingsManagerService: SettingsManagerService) {
    super();
    this.settings = this.pluginManagerService.createSettings('navigation-tree', 'plugin', defaultSettings);

    this.registerSettings();

    makeObservable(this, {
      disabled: computed,
    });
  }

  private registerSettings() {
    this.settingsManagerService.registerSettings(this.settings, () => [
      // {
      //   group: NAVIGATION_TREE_SETTINGS_GROUP,
      //   key: 'disabled',
      //   type: ESettingsValueType.Checkbox,
      //   name: 'Disable navigation tree',
      // },
    ]);
  }
}
