/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';

import { UserDataService } from '../UserDataService.js';
import { UserInfoResource } from '../UserInfoResource.js';
import { UserConfigurationStorage } from './UserConfigurationStorage.js';
import type { UserConfigurationStore } from './UserConfigurationStore.js';

export class UserConfigurationServiceImpl {
  private store: UserConfigurationStore | undefined;

  constructor(
    private readonly userInfoResource: UserInfoResource,
    private readonly userDataService: UserDataService,
    private readonly userConfigurationStorage: UserConfigurationStorage,
  ) {}

  register(): void {
    this.store = this.userDataService.registerStorage(this.userConfigurationStorage);
    this.userInfoResource.onUserChange.addPostHandler(() => this.loadConfiguration().catch(console.error));
  }

  private async loadConfiguration(): Promise<void> {
    this.store?.stop();

    if (this.userConfigurationStorage.isAvailable()) {
      await this.store?.load();
    }
  }
}

export type UserConfigurationService = UserConfigurationServiceImpl;

export class UserConfigurationServiceDI extends Context.Service<UserConfigurationServiceDI, UserConfigurationServiceImpl>()(
  '@cloudbeaver/core-authentication/UserConfiguration/UserConfigurationService#UserConfigurationService',
) {
  static readonly implementation = UserConfigurationServiceImpl;
  static readonly dependencies = () => [UserInfoResource, UserDataService, UserConfigurationStorage] as const;
  static readonly make: Effect.Effect<
    UserConfigurationServiceImpl,
    never,
    | Context.Service.Identifier<typeof UserInfoResource>
    | Context.Service.Identifier<typeof UserDataService>
    | Context.Service.Identifier<typeof UserConfigurationStorage>
  > = Effect.gen(function* makeUserConfigurationService() {
    const userInfoResource = yield* UserInfoResource;
    const userDataService = yield* UserDataService;
    const userConfigurationStorage = yield* UserConfigurationStorage;

    return new UserConfigurationServiceImpl(userInfoResource, userDataService, userConfigurationStorage);
  });
  static readonly layer: Layer.Layer<
    UserConfigurationServiceDI,
    never,
    | Context.Service.Identifier<typeof UserInfoResource>
    | Context.Service.Identifier<typeof UserDataService>
    | Context.Service.Identifier<typeof UserConfigurationStorage>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const UserConfigurationService = UserConfigurationServiceDI;
