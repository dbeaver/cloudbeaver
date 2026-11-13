/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';

import type { IUserDataStorage } from '../IUserDataStorage.js';
import { LocalUserDataStorage } from '../LocalUserDataStorage.js';
import { UserDataService } from '../UserDataService.js';
import { UserInfoResource } from '../UserInfoResource.js';
import { UserConfigurationResource } from './UserConfigurationResource.js';
import { UserConfigurationStore } from './UserConfigurationStore.js';

export class UserConfigurationStorageImpl implements IUserDataStorage<UserConfigurationStore> {
  constructor(
    private readonly userConfigurationResource: UserConfigurationResource,
    private readonly userInfoResource: UserInfoResource,
    private readonly userDataService: UserDataService,
    private readonly localUserDataStorage: LocalUserDataStorage,
  ) {}

  isAvailable(): boolean {
    return this.userInfoResource.isAuthenticated();
  }

  createStore(getUserId: () => string): UserConfigurationStore {
    return new UserConfigurationStore(
      getUserId,
      {
        load: () => this.userConfigurationResource.load(),
        save: data => this.userConfigurationResource.saveConfiguration(data),
      },
      this.userDataService.registerStorage(this.localUserDataStorage),
    );
  }
}

export type UserConfigurationStorage = UserConfigurationStorageImpl;

export class UserConfigurationStorageDI extends Context.Service<UserConfigurationStorageDI, UserConfigurationStorageImpl>()(
  '@cloudbeaver/core-authentication/UserConfiguration/UserConfigurationStorage#UserConfigurationStorage',
) {
  static readonly implementation = UserConfigurationStorageImpl;
  static readonly dependencies = () => [UserConfigurationResource, UserInfoResource, UserDataService, LocalUserDataStorage] as const;
  static readonly make: Effect.Effect<
    UserConfigurationStorageImpl,
    never,
    | Context.Service.Identifier<typeof UserConfigurationResource>
    | Context.Service.Identifier<typeof UserInfoResource>
    | Context.Service.Identifier<typeof UserDataService>
    | Context.Service.Identifier<typeof LocalUserDataStorage>
  > = Effect.gen(function* makeUserConfigurationStorage() {
    const userConfigurationResource = yield* UserConfigurationResource;
    const userInfoResource = yield* UserInfoResource;
    const userDataService = yield* UserDataService;
    const localUserDataStorage = yield* LocalUserDataStorage;

    return new UserConfigurationStorageImpl(userConfigurationResource, userInfoResource, userDataService, localUserDataStorage);
  });
  static readonly layer: Layer.Layer<
    UserConfigurationStorageDI,
    never,
    | Context.Service.Identifier<typeof UserConfigurationResource>
    | Context.Service.Identifier<typeof UserInfoResource>
    | Context.Service.Identifier<typeof UserDataService>
    | Context.Service.Identifier<typeof LocalUserDataStorage>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const UserConfigurationStorage = UserConfigurationStorageDI;
