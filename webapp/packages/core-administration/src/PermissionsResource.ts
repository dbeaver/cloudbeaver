/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { CachedMapAllKey, CachedMapResource, resourceKeyList } from '@cloudbeaver/core-resource';
import { SessionDataResource } from '@cloudbeaver/core-root';
import { type AdminObjectGrantInfoFragment, type AdminPermissionInfoFragment, GraphQLService } from '@cloudbeaver/core-sdk';

export type PermissionInfo = AdminPermissionInfoFragment;
export type AdminObjectGrantInfo = AdminObjectGrantInfoFragment;

export class PermissionsResourceImpl extends CachedMapResource<string, PermissionInfo> {
  constructor(
    private readonly graphQLService: GraphQLService,
    sessionDataResource: SessionDataResource,
  ) {
    super();

    this.sync(
      sessionDataResource,
      () => {},
      () => CachedMapAllKey,
    );
  }

  protected async loader(): Promise<Map<string, PermissionInfo>> {
    const { permissions } = await this.graphQLService.sdk.getPermissionsList();

    this.replace(resourceKeyList(permissions.map(permission => permission.id)), permissions);

    return this.data;
  }

  protected validateKey(key: string): boolean {
    return typeof key === 'string';
  }
}

export type PermissionsResource = PermissionsResourceImpl;

export class PermissionsResourceDI extends Context.Service<PermissionsResourceDI, PermissionsResourceImpl>()(
  '@cloudbeaver/core-administration/PermissionsResource#PermissionsResource',
) {
  static readonly implementation = PermissionsResourceImpl;

  static readonly dependencies = () => [GraphQLService, SessionDataResource] as const;
  static readonly make: Effect.Effect<
    PermissionsResourceImpl,
    never,
    Context.Service.Identifier<typeof GraphQLService> | Context.Service.Identifier<typeof SessionDataResource>
  > = Effect.gen(function* makePermissionsResource() {
    const graphQLService = yield* GraphQLService;
    const sessionDataResource = yield* SessionDataResource;

    return new PermissionsResourceImpl(graphQLService, sessionDataResource);
  });
  static readonly layer: Layer.Layer<
    PermissionsResourceDI,
    never,
    Context.Service.Identifier<typeof GraphQLService> | Context.Service.Identifier<typeof SessionDataResource>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const PermissionsResource = PermissionsResourceDI;
