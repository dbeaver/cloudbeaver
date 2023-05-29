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
  hideConnectionViewForUsers: false,
};

export type PluginConnectionsSettings = typeof defaultSettings;

@injectable()
export class PluginConnectionsSettingsService {
  readonly settings: PluginSettings<PluginConnectionsSettings>;

  constructor(private readonly pluginManagerService: PluginManagerService) {
    this.settings = this.pluginManagerService.getPluginSettings('connections', defaultSettings);
  }
}
