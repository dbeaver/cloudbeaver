/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { StorageService } from '@cloudbeaver/core-storage';

import type { IUserDataStorage } from './IUserDataStorage.js';
import { UserDataStore } from './UserDataStore.js';

export class LocalUserDataStorageImpl implements IUserDataStorage {
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

export type LocalUserDataStorage = LocalUserDataStorageImpl;

export class LocalUserDataStorageDI extends Context.Service<LocalUserDataStorageDI, LocalUserDataStorageImpl>()(
  '@cloudbeaver/core-authentication/LocalUserDataStorage#LocalUserDataStorage',
) {
  static readonly implementation = LocalUserDataStorageImpl;
  static readonly dependencies = () => [StorageService] as const;
  static readonly make: Effect.Effect<LocalUserDataStorageImpl, never, Context.Service.Identifier<typeof StorageService>> = Effect.gen(
    function* makeLocalUserDataStorage() {
      const storageService = yield* StorageService;

      return new LocalUserDataStorageImpl(storageService);
    },
  );
  static readonly layer: Layer.Layer<LocalUserDataStorageDI, never, Context.Service.Identifier<typeof StorageService>> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const LocalUserDataStorage = LocalUserDataStorageDI;
