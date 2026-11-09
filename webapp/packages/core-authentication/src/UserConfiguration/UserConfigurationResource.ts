/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { CachedDataResource } from '@cloudbeaver/core-resource';
import { GraphQLService } from '@cloudbeaver/core-sdk';

import type { UserData } from '../IUserDataStorage.js';
import { UserInfoResource } from '../UserInfoResource.js';

@injectable(() => [GraphQLService, UserInfoResource])
export class UserConfigurationResource extends CachedDataResource<UserData> {
  constructor(
    private readonly graphQLService: GraphQLService,
    userInfoResource: UserInfoResource,
  ) {
    super(() => ({}));

    this.sync(userInfoResource);
    userInfoResource.onUserChange.addHandler(() => this.clear());
  }

  async saveConfiguration(configuration: UserData): Promise<void> {
    await this.performUpdate(undefined, [], async () => {
      const { configuration: savedConfiguration } = await this.graphQLService.sdk.authSetUserConfiguration({ configuration });

      this.setData(savedConfiguration);
    });
  }

  protected async loader(): Promise<UserData> {
    const { user } = await this.graphQLService.sdk.getUserConfiguration();

    return user?.userConfiguration ?? {};
  }
}
