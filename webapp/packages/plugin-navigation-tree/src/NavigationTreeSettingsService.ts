/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed, makeObservable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { PluginManagerService, PluginSettings } from '@cloudbeaver/core-plugin';

const defaultSettings = {
  disabled: false,
};

export type NavigationTreeSettings = typeof defaultSettings;

@injectable()
export class NavigationTreeSettingsService {
  get disabled(): boolean {
    return this.settings.getValue('disabled');
  }

  readonly settings: PluginSettings<NavigationTreeSettings>;

  constructor(private readonly pluginManagerService: PluginManagerService) {
    this.settings = this.pluginManagerService.createSettings('navigation-tree', 'plugin', defaultSettings);

    makeObservable(this, {
      disabled: computed,
    });
  }
}
