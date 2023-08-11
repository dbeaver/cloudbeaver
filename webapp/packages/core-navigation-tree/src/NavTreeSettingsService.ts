/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { PluginManagerService, PluginSettings } from '@cloudbeaver/core-plugin';

const defaultSettings = {
  childrenLimit: 100,
  editing: true,
  deleting: true,
};

export type NavTreeSettings = typeof defaultSettings;

@injectable()
export class NavTreeSettingsService {
  readonly settings: PluginSettings<NavTreeSettings>;

  constructor(private readonly pluginManagerService: PluginManagerService) {
    this.settings = this.pluginManagerService.createSettings('navigation-tree', 'core', defaultSettings);
  }
}
