/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';

import type { IUserDataStorage } from '../IUserDataStorage.js';
import { UserInfoResource } from '../UserInfoResource.js';
import { UserConfigurationResource } from './UserConfigurationResource.js';
import { UserConfigurationStore } from './UserConfigurationStore.js';

@injectable(() => [UserConfigurationResource, UserInfoResource])
export class UserConfigurationStorage implements IUserDataStorage<UserConfigurationStore> {
  constructor(
    private readonly userConfigurationResource: UserConfigurationResource,
    private readonly userInfoResource: UserInfoResource,
  ) {}

  isAvailable(): boolean {
    return this.userInfoResource.isAuthenticated();
  }

  createStore(getUserId: () => string): UserConfigurationStore {
    return new UserConfigurationStore(getUserId, {
      load: () => this.userConfigurationResource.load(),
      save: data => this.userConfigurationResource.saveConfiguration(data),
    });
  }
}
