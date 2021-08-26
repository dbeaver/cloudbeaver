/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import {
  AuthProviderConfigurationParametersFragment, CachedMapResource, GetAuthProviderConfigurationParametersQueryVariables,
  GraphQLService, isResourceKeyList, ResourceKey, ResourceKeyUtils
} from '@cloudbeaver/core-sdk';

@injectable()
export class AuthConfigurationParametersResource
  extends CachedMapResource<
  string,
  AuthProviderConfigurationParametersFragment[],
  GetAuthProviderConfigurationParametersQueryVariables
  > {
  constructor(
    private readonly graphQLService: GraphQLService
  ) {
    super();
  }

  protected async loader(key: ResourceKey<string>) {
    const values: AuthProviderConfigurationParametersFragment[][] = [];
    await ResourceKeyUtils.forEachAsync(key, async key => {
      const { parameters } = await this.graphQLService.sdk.getAuthProviderConfigurationParameters({ providerId: key });

      values.push(parameters);
    });

    this.set(key, isResourceKeyList(key) ? values : values[0]);

    return this.data;
  }
}
