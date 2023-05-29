/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';

import { LocalStorageSaveService } from './LocalStorageSaveService';

@injectable()
export class SettingsService {
  constructor(private readonly localStorageSaveService: LocalStorageSaveService) {}

  /**
   * if autosaved value exits the settings object will be populated with this value
   * @param key
   * @param settings - observable object expected
   */
  registerSettings<T extends Record<any, any>>(key: string, settings: T, defaultValue: () => T, onUpdate?: () => void): void {
    this.localStorageSaveService.withAutoSave(key, settings, defaultValue, undefined, onUpdate);
  }
}
