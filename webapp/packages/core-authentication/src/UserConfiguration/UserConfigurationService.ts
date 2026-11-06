/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';

import { UserDataService } from '../UserDataService.js';
import { UserInfoResource } from '../UserInfoResource.js';
import { UserConfigurationStorage } from './UserConfigurationStorage.js';
import type { UserConfigurationStore } from './UserConfigurationStore.js';

@injectable(() => [UserInfoResource, UserDataService, UserConfigurationStorage])
export class UserConfigurationService {
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
