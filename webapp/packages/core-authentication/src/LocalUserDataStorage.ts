/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { StorageService } from '@cloudbeaver/core-storage';

import type { IUserDataStorage } from './IUserDataStorage.js';
import { UserDataStore } from './UserDataStore.js';

@injectable(() => [StorageService])
export class LocalUserDataStorage implements IUserDataStorage {
  constructor(private readonly storageService: StorageService) {}

  isAvailable(): boolean {
    return true;
  }

  createStore(getUserId: () => string): UserDataStore {
    const store = new UserDataStore(getUserId);
    this.storageService.registerSettings('user_data', store.data, () => new Map());

    return store;
  }
}
