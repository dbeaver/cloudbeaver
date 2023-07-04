/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { PluginManagerService, PluginSettings } from '@cloudbeaver/core-plugin';
import { SettingsManagerService } from '@cloudbeaver/core-settings';

import { CONNECTIONS_SETTINGS_GROUP, settings } from './CONNECTIONS_SETTINGS_GROUP';

const defaultSettings = {
  hideConnectionViewForUsers: false,
};

export type PluginConnectionsSettings = typeof defaultSettings;

@injectable()
export class PluginConnectionsSettingsService {
  readonly settings: PluginSettings<PluginConnectionsSettings>;

  constructor(private readonly pluginManagerService: PluginManagerService, settingsManagerService: SettingsManagerService) {
    this.settings = this.pluginManagerService.createSettings('connections', 'plugin', defaultSettings);

    settingsManagerService.addGroup(CONNECTIONS_SETTINGS_GROUP);
    settingsManagerService.addSettings(settings.scopeType, settings.scope, settings.settingsData);
  }
}
