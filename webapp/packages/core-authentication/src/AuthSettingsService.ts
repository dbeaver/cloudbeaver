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

import { AUTH_SETTINGS_GROUP, settings } from './AUTH_SETTINGS_GROUP';

const defaultSettings = {
  baseAuthProvider: undefined as undefined | string,
  primaryAuthProvider: 'local',
  disableAnonymousAccess: false,
};

export type AuthSettings = typeof defaultSettings;

@injectable()
export class AuthSettingsService {
  readonly settings: PluginSettings<AuthSettings>;

  constructor(private readonly pluginManagerService: PluginManagerService, settingsManagerService: SettingsManagerService) {
    this.settings = this.pluginManagerService.createSettings('authentication', 'core', defaultSettings);

    settingsManagerService.addGroup(AUTH_SETTINGS_GROUP);
    settingsManagerService.addSettings(settings.scopeType, settings.scope, settings.settingsData);
  }
}
