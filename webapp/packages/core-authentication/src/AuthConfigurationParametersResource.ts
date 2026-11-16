/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, disposeService, Effect, Layer } from '@cloudbeaver/core-di';
import { CachedMapResource, isResourceAlias, type ResourceKey, ResourceKeyUtils } from '@cloudbeaver/core-resource';
import { EAdminPermission, SessionDataResource, SessionPermissionsResource } from '@cloudbeaver/core-root';
import {
  type AuthProviderConfigurationParametersFragment,
  type GetAuthProviderConfigurationParametersQueryVariables,
  GraphQLService,
} from '@cloudbeaver/core-sdk';

export class AuthConfigurationParametersResourceImpl extends CachedMapResource<
  string,
  AuthProviderConfigurationParametersFragment[],
  GetAuthProviderConfigurationParametersQueryVariables
> {
  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly sessionDataResource: SessionDataResource,
    sessionPermissionsResource: SessionPermissionsResource,
  ) {
    super();

    this.sessionDataResource.outdateResource(this);
    sessionPermissionsResource.require(this, EAdminPermission.admin);
  }

  protected async loader(key: ResourceKey<string>): Promise<Map<string, AuthProviderConfigurationParametersFragment[]>> {
    if (isResourceAlias(key)) {
      throw new Error('Aliases not supported by this resource.');
    }

    const values: AuthProviderConfigurationParametersFragment[][] = [];
    await ResourceKeyUtils.forEachAsync(key, async key => {
      const { parameters } = await this.graphQLService.sdk.getAuthProviderConfigurationParameters({ providerId: key });

      values.push(parameters);
    });

    this.set(ResourceKeyUtils.toList(key), values);

    return this.data;
  }

  protected validateKey(key: string): boolean {
    return typeof key === 'string';
  }
}

export type AuthConfigurationParametersResource = AuthConfigurationParametersResourceImpl;

export class AuthConfigurationParametersResourceDI extends Context.Service<
  AuthConfigurationParametersResourceDI,
  AuthConfigurationParametersResourceImpl
>()('@cloudbeaver/core-authentication/AuthConfigurationParametersResource#AuthConfigurationParametersResource') {
  static readonly implementation = AuthConfigurationParametersResourceImpl;

  static readonly dependencies = () => [GraphQLService, SessionDataResource, SessionPermissionsResource] as const;
  static readonly make: Effect.Effect<
    AuthConfigurationParametersResourceImpl,
    never,
    | Context.Service.Identifier<typeof GraphQLService>
    | Context.Service.Identifier<typeof SessionDataResource>
    | Context.Service.Identifier<typeof SessionPermissionsResource>
  > = Effect.gen(function* makeAuthConfigurationParametersResource() {
    const graphQLService = yield* GraphQLService;
    const sessionDataResource = yield* SessionDataResource;
    const sessionPermissionsResource = yield* SessionPermissionsResource;

    return new AuthConfigurationParametersResourceImpl(graphQLService, sessionDataResource, sessionPermissionsResource);
  });
  static readonly layer: Layer.Layer<
    AuthConfigurationParametersResourceDI,
    never,
    | Context.Service.Identifier<typeof GraphQLService>
    | Context.Service.Identifier<typeof SessionDataResource>
    | Context.Service.Identifier<typeof SessionPermissionsResource>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const AuthConfigurationParametersResource = AuthConfigurationParametersResourceDI;
