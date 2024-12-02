/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { LocalStorageSaveService, type LocalStorageType } from '@cloudbeaver/core-browser';
import { injectable } from '@cloudbeaver/core-di';
import type { ISyncExecutor } from '@cloudbeaver/core-executor';

@injectable()
export class StorageService {
  readonly onStorageChange: ISyncExecutor<LocalStorageType>;
  constructor(private readonly localStorageSaveService: LocalStorageSaveService) {
    this.onStorageChange = this.localStorageSaveService.onStorageChange;
  }

  /**
   * if autosaved value exits the settings object will be populated with this value
   * @param key
   * @param settings - observable object expected
   */
  registerSettings<T extends Record<any, any> | Map<any, any>>(
    storeId: string,
    store: T,
    defaultValue: () => T extends any ? T : never,
    remap?: (savedStore: T) => T,
    onUpdate?: () => void,
    storageType?: LocalStorageType,
  ): void {
    this.localStorageSaveService.withAutoSave(storeId, store, defaultValue, remap, onUpdate, storageType);
  }
}
