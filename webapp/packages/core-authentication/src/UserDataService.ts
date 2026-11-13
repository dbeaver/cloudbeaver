/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';

import type { IUserDataStorage } from './IUserDataStorage.js';
import { LocalUserDataStorage } from './LocalUserDataStorage.js';
import type { UserDataStore } from './UserDataStore.js';
import { UserInfoResource } from './UserInfoResource.js';

export class UserDataServiceImpl {
  private readonly stores: Map<IUserDataStorage, UserDataStore>;

  constructor(
    private readonly userInfoResource: UserInfoResource,
    private readonly localUserDataStorage: LocalUserDataStorage,
  ) {
    this.stores = new Map();
    this.registerStorage(this.localUserDataStorage);
  }

  getUserData<T extends Record<any, any>>(key: string, defaultValue: () => T, validate?: (data: T) => boolean): T {
    return this.withStorage(this.localUserDataStorage).getUserData(key, defaultValue, validate);
  }

  withStorage(requested: IUserDataStorage): UserDataStore {
    const storage = requested.isAvailable() ? requested : this.localUserDataStorage;

    return this.registerStorage(storage);
  }

  registerStorage<TStore extends UserDataStore>(storage: IUserDataStorage<TStore>): TStore {
    const existing = this.stores.get(storage);

    if (existing) {
      return existing as TStore;
    }

    const store = storage.createStore(() => this.userInfoResource.getId());
    this.stores.set(storage, store);

    return store;
  }
}

export type UserDataService = UserDataServiceImpl;

export class UserDataServiceDI extends Context.Service<UserDataServiceDI, UserDataServiceImpl>()(
  '@cloudbeaver/core-authentication/UserDataService#UserDataService',
) {
  static readonly implementation = UserDataServiceImpl;
  static readonly dependencies = () => [UserInfoResource, LocalUserDataStorage] as const;
  static readonly make: Effect.Effect<
    UserDataServiceImpl,
    never,
    Context.Service.Identifier<typeof UserInfoResource> | Context.Service.Identifier<typeof LocalUserDataStorage>
  > = Effect.gen(function* makeUserDataService() {
    const userInfoResource = yield* UserInfoResource;
    const localUserDataStorage = yield* LocalUserDataStorage;
    return new UserDataServiceImpl(userInfoResource, localUserDataStorage);
  });
  static readonly layer: Layer.Layer<
    UserDataServiceDI,
    never,
    Context.Service.Identifier<typeof UserInfoResource> | Context.Service.Identifier<typeof LocalUserDataStorage>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const UserDataService = UserDataServiceDI;
