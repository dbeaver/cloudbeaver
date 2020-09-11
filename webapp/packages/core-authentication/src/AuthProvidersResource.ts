/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import {
  GraphQLService,
  CachedDataResource,
  AuthProviderInfo
} from '@cloudbeaver/core-sdk';

export type AuthProvider = Omit<AuthProviderInfo, 'configurationParameters'>

@injectable()
export class AuthProvidersResource extends CachedDataResource<AuthProvider[], null> {
  constructor(
    private graphQLService: GraphQLService,
  ) {
    super([]);
  }

  isLoaded() {
    return !!this.data.length;
  }

  protected async loader(key: null): Promise<AuthProvider[]> {
    const { providers } = await this.graphQLService.sdk.getAuthProviders();

    this.markUpdated(key);
    return providers;
  }
}
