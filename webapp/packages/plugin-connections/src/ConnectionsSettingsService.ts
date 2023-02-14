/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { PluginManagerService, PluginSettings } from '@cloudbeaver/core-plugin';

export interface ConnectionsSettings {
  hideConnectionViewForUsers: boolean;
  disabled: boolean;
}

const defaultSettings: ConnectionsSettings = {
  hideConnectionViewForUsers: false,
  disabled: false,
};

@injectable()
export class ConnectionsSettingsService {
  readonly settings: PluginSettings<ConnectionsSettings>;

  constructor(private readonly pluginManagerService: PluginManagerService) {
    this.settings = this.pluginManagerService.getPluginSettings('connections', defaultSettings);
  }
}
