/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@dbeaver/core/di';

import { LocalStorageSaveService } from './LocalStorageSaveService';

const PLUGIN_SETTINGS_KEY = 'pluginSettings';

@injectable()
export class SettingsService {

  private properties = new Map<string, any>();

  constructor(private localStorageSaveService: LocalStorageSaveService) {
  }

  /**
   *
   * @param name - expected in format {plugin-id}.{scope-id}.{property-name}, default scope-id = main.
   * @param defaultValue
   */
  getProperty<T>(name: string, defaultValue: T): T {
    if (this.properties.has(name)) {
      return this.properties.get(name) as T;
    }
    this.properties.set(name, defaultValue);
    return defaultValue;
  }

  /**
   * if autosaved value exits the settings object will be populated with this value
   * @param key
   * @param settings - observable object expected
   */
  registerSettings<T extends object>(settings: T, key: string): void {
    this.localStorageSaveService.withAutoSave(settings, PLUGIN_SETTINGS_KEY);
  }
}
