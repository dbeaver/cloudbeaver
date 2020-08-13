/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createHash } from 'crypto';

import { injectable } from '@cloudbeaver/core-di';

import { AuthProvidersResource } from './AuthProvidersResource';

@injectable()
export class AuthProviderService {

  constructor(
    private providers: AuthProvidersResource,
  ) { }

  async processCredentials(providerId: string, credentials: Record<string, any>) {
    const providers = await this.providers.load(null);
    const provider = providers.find(provider => provider.id === providerId);

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
}
