/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { Executor, type IExecutor } from '@cloudbeaver/core-executor';
import { md5, uuid } from '@cloudbeaver/core-utils';

import { type AuthProvider, AuthProvidersResource } from './AuthProvidersResource.js';
import type { IAuthCredentials } from './IAuthCredentials.js';

interface IServiceDescriptionProps {
  configurationWizard: boolean;
}

export type ServiceDescriptionComponent = React.FC<IServiceDescriptionProps>;

interface IServiceDescriptionLinkOptions {
  isSupported: (service: AuthProvider) => boolean;
  description: () => ServiceDescriptionComponent;
}

interface IServiceDescriptionLink extends IServiceDescriptionLinkOptions {
  id: string;
}

export interface RequestedProvider {
  providerId: string;
  configurationId?: string;
}

export class AuthProviderServiceImpl {
  readonly requestAuthProvider: IExecutor<RequestedProvider>;

  private readonly serviceDescriptionLinker: IServiceDescriptionLink[]; // TODO: probably should be replaced by PlaceholderContainer

  constructor(private readonly authProvidersResource: AuthProvidersResource) {
    this.requestAuthProvider = new Executor();
    this.serviceDescriptionLinker = [];
  }

  getServiceDescriptionLinks(service: AuthProvider): IServiceDescriptionLink[] {
    return this.serviceDescriptionLinker.filter(link => link.isSupported(service));
  }

  addServiceDescriptionLink(link: IServiceDescriptionLinkOptions): void {
    this.serviceDescriptionLinker.push({
      id: uuid(),
      ...link,
    });
  }

  async requireProvider(providerId: string, configurationId?: string): Promise<boolean> {
    const contexts = await this.requestAuthProvider.execute({ providerId, configurationId });
    const provider = contexts.getContext(AuthProviderContext);

    return provider.get();
  }

  hashValue(value: string): string {
    return md5(value).toUpperCase();
  }

  async processCredentials(providerId: string, credentials: IAuthCredentials): Promise<IAuthCredentials> {
    const provider = await this.authProvidersResource.load(providerId);

    if (!provider) {
      return credentials;
    }

    const credentialsProcessed: IAuthCredentials = {
      profile: credentials.profile,
      credentials: { ...credentials.credentials },
    };

    const profile = provider.credentialProfiles[credentials.profile as any as number];

    for (const parameter of profile?.credentialParameters || []) {
      if (parameter.encryption === 'hash' && parameter.id in credentialsProcessed.credentials) {
        const value = credentialsProcessed.credentials[parameter.id];

        if (typeof value === 'string') {
          credentialsProcessed.credentials[parameter.id] = this.hashValue(value);
        }
      }
    }

    return credentialsProcessed;
  }
}

export type AuthProviderService = AuthProviderServiceImpl;

export class AuthProviderServiceDI extends Context.Service<AuthProviderServiceDI, AuthProviderServiceImpl>()(
  '@cloudbeaver/core-authentication/AuthProviderService#AuthProviderService',
) {
  static readonly implementation = AuthProviderServiceImpl;

  static readonly dependencies = () => [AuthProvidersResource] as const;
  static readonly make: Effect.Effect<AuthProviderServiceImpl, never, Context.Service.Identifier<typeof AuthProvidersResource>> = Effect.gen(
    function* makeAuthProviderService() {
      const authProvidersResource = yield* AuthProvidersResource;

      return new AuthProviderServiceImpl(authProvidersResource);
    },
  );
  static readonly layer: Layer.Layer<AuthProviderServiceDI, never, Context.Service.Identifier<typeof AuthProvidersResource>> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const AuthProviderService = AuthProviderServiceDI;

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
