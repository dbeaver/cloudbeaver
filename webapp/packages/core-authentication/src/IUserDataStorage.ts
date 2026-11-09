/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { UserDataStore } from './UserDataStore.js';

export type UserData = Record<string, Record<string, any>>;

export interface IUserDataStorage<TStore extends UserDataStore = UserDataStore> {
  isAvailable(): boolean;
  createStore(getUserId: () => string): TStore;
}
