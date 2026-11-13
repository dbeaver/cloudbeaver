/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { CachedDataResource } from '@cloudbeaver/core-resource';
import { EAdminPermission, SessionPermissionsResource } from '@cloudbeaver/core-root';
import { GraphQLService } from '@cloudbeaver/core-sdk';

export class AuthRolesResourceImpl extends CachedDataResource<string[]> {
  constructor(
    private readonly graphQLService: GraphQLService,
    sessionPermissionsResource: SessionPermissionsResource,
  ) {
    super(() => []);

    sessionPermissionsResource.require(this, EAdminPermission.admin).outdateResource(this);
  }

  protected async loader(): Promise<string[]> {
    const { roles } = await this.graphQLService.sdk.getAuthRoles();

    return roles;
  }
}

export type AuthRolesResource = AuthRolesResourceImpl;

export class AuthRolesResourceDI extends Context.Service<AuthRolesResourceDI, AuthRolesResourceImpl>()(
  '@cloudbeaver/core-authentication/AuthRolesResource#AuthRolesResource',
) {
  static readonly implementation = AuthRolesResourceImpl;

  static readonly dependencies = () => [GraphQLService, SessionPermissionsResource] as const;
  static readonly make: Effect.Effect<
    AuthRolesResourceImpl,
    never,
    Context.Service.Identifier<typeof GraphQLService> | Context.Service.Identifier<typeof SessionPermissionsResource>
  > = Effect.gen(function* makeAuthRolesResource() {
    const graphQLService = yield* GraphQLService;
    const sessionPermissionsResource = yield* SessionPermissionsResource;

    return new AuthRolesResourceImpl(graphQLService, sessionPermissionsResource);
  });
  static readonly layer: Layer.Layer<
    AuthRolesResourceDI,
    never,
    Context.Service.Identifier<typeof GraphQLService> | Context.Service.Identifier<typeof SessionPermissionsResource>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const AuthRolesResource = AuthRolesResourceDI;
