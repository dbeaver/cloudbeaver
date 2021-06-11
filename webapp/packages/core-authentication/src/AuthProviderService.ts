/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { Executor, IExecutor } from '@cloudbeaver/core-executor';
import type { ObjectOrigin } from '@cloudbeaver/core-sdk';
import { md5 } from '@cloudbeaver/core-utils';

import { AuthProvidersResource } from './AuthProvidersResource';

@injectable()
export class AuthProviderService {
  readonly requestAuthProvider: IExecutor<ObjectOrigin>;
  constructor(
    private readonly authProvidersResource: AuthProvidersResource
  ) {
    this.requestAuthProvider = new Executor();
  }

  async requireProvider(type: string, subType?: string): Promise<boolean>
  async requireProvider(origin: ObjectOrigin): Promise<boolean>
  async requireProvider(origin: ObjectOrigin | string, subType?: string): Promise<boolean> {
    if (typeof origin === 'string') {
      origin = {
        displayName: '',
        type: origin,
        subType,
      };
    }

    const contexts = await this.requestAuthProvider.execute(origin);
    const provider = contexts.getContext(AuthProviderContext);

    return provider.get();
  }

  hashValue(value: string): string {
    return md5(value).toUpperCase();
  }

  async processCredentials(providerId: string, credentials: Record<string, any>): Promise<Record<string, any>> {
    const provider = await this.authProvidersResource.load(providerId);

    if (!provider) {
      return credentials;
    }

    const credentialsProcessed = { ...credentials };
    for (const parameter of provider.credentialParameters) {
      if (parameter.encryption === 'hash' && parameter.id in credentialsProcessed) {
        credentialsProcessed[parameter.id] = this.hashValue(credentialsProcessed[parameter.id]);
      }
    }

    return credentialsProcessed;
  }
}

interface IAuthProviderContext {
  get: () => boolean;
  auth: () => void;
}

export function AuthProviderContext(): IAuthProviderContext {
  let state = false;

  return {
    get: () => state,
    auth: () => {
      state = true;
    },
  };
}
