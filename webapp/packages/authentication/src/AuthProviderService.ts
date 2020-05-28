/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createHash } from 'crypto';

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

  processCredentials(providerId: string, credentials: Record<string, any>) {
    const provider = this.providers.data.find(provider => provider.id === providerId);

    if (!provider) {
      return credentials;
    }

    const credentialsProcessed = { ...credentials };
    for (const parameter of provider.credentialParameters) {
      if (parameter.encryption === 'hash' && parameter.id in credentialsProcessed) {
        const md5Hash = createHash('md5')
          .update(credentialsProcessed[parameter.id])
          .digest('hex')
          .toUpperCase();
        credentialsProcessed[parameter.id] = md5Hash;
      }
    }

    return credentialsProcessed;
  }

  private async refreshAsync(data: AuthProvider[]): Promise<AuthProvider[]> {
    const { providers } = await this.graphQLService.gql.getAuthProviders();

    return providers;
  }
}
