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
  notificationsPool: 5,
  maxPersistentAllow: 5,

};

export type EventsSettings = typeof defaultSettings;

@injectable()
export class EventsSettingsService {
  readonly settings: PluginSettings<EventsSettings>;

  constructor(private readonly pluginManagerService: PluginManagerService) { 
    this.settings = this.pluginManagerService.getPluginSettings('core_events', defaultSettings);
  }
}
