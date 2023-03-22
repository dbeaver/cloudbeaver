/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { PluginManagerService, PluginSettings } from '@cloudbeaver/core-plugin';

const defaultSettings = {
  // temporary limit for all nodes children in app
  childrenLimit: 1000,
  editing: true,
  deleting: true,
};

export type NavTreeSettings = typeof defaultSettings;

@injectable()
export class NavTreeSettingsService {
  readonly settings: PluginSettings<NavTreeSettings>;

  constructor(private readonly pluginManagerService: PluginManagerService) {
    this.settings = this.pluginManagerService.getCoreSettings('navigation-tree', defaultSettings);
  }
}
