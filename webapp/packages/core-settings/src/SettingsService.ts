/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';

import { LocalStorageSaveService } from './LocalStorageSaveService';

@injectable()
export class SettingsService {
  constructor(private localStorageSaveService: LocalStorageSaveService) { }

  /**
   * if autosaved value exits the settings object will be populated with this value
   * @param key
   * @param settings - observable object expected
   */
  registerSettings<T extends Record<any, any>>(settings: T, key: string): void {
    this.localStorageSaveService.withAutoSave(settings, key);
  }
}
