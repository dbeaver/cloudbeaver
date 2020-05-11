/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@dbeaver/core/di';
import {
  GraphQLService, CachedResource, AuthProviderInfo
} from '@dbeaver/core/sdk';

export type AuthProvider = Omit<AuthProviderInfo, 'configurationParameters'>

@injectable()
export class AuthProviderService {
  readonly providers = new CachedResource([], this.refreshAsync.bind(this), data => !!data.length)

  constructor(
    private graphQLService: GraphQLService,
  ) { }

  private async refreshAsync(data: AuthProvider[]): Promise<AuthProvider[]> {
    const { providers } = await this.graphQLService.gql.getAuthProviders();

    return providers;
  }
}
