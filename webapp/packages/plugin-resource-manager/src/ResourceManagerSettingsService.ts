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
  disabled: false,
};

export type ResourceManagerSettings = typeof defaultSettings;

@injectable()
export class ResourceManagerSettingsService {
  readonly settings: PluginSettings<ResourceManagerSettings>;
  /** @deprecated Use settings instead, will be removed in 23.0.0 */
  readonly deprecatedSettings: PluginSettings<ResourceManagerSettings>;

  constructor(private readonly pluginManagerService: PluginManagerService) {
    this.settings = this.pluginManagerService.getPluginSettings('resource-manager', defaultSettings);
    this.deprecatedSettings = this.pluginManagerService.getDeprecatedPluginSettings('plugin_resource_manager', defaultSettings);
  }
}
