/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { CachedDataResource, type ResourceKey } from '@cloudbeaver/core-resource';
import { GraphQLService } from '@cloudbeaver/core-sdk';

import { UserInfoResource } from './UserInfoResource.js';
import type { UserMetaParameter } from './UserMetaParametersResource.js';

export class UserInfoMetaParametersResourceImpl extends CachedDataResource<UserMetaParameter | undefined> {
  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly userInfoResource: UserInfoResource,
  ) {
    super(() => undefined, undefined);

    this.sync(this.userInfoResource);
  }

  protected async loader(param: ResourceKey<void>): Promise<UserMetaParameter | undefined> {
    const { user } = await this.graphQLService.sdk.getActiveUserMetaParameters();

    return user?.metaParameters;
  }
}

export type UserInfoMetaParametersResource = UserInfoMetaParametersResourceImpl;

export class UserInfoMetaParametersResourceDI extends Context.Service<UserInfoMetaParametersResourceDI, UserInfoMetaParametersResourceImpl>()(
  '@cloudbeaver/core-authentication/UserInfoMetaParametersResource#UserInfoMetaParametersResource',
) {
  static readonly implementation = UserInfoMetaParametersResourceImpl;

  static readonly dependencies = () => [GraphQLService, UserInfoResource] as const;
  static readonly make: Effect.Effect<
    UserInfoMetaParametersResourceImpl,
    never,
    Context.Service.Identifier<typeof GraphQLService> | Context.Service.Identifier<typeof UserInfoResource>
  > = Effect.gen(function* makeUserInfoMetaParametersResource() {
    const graphQLService = yield* GraphQLService;
    const userInfoResource = yield* UserInfoResource;

    return new UserInfoMetaParametersResourceImpl(graphQLService, userInfoResource);
  });
  static readonly layer: Layer.Layer<
    UserInfoMetaParametersResourceDI,
    never,
    Context.Service.Identifier<typeof GraphQLService> | Context.Service.Identifier<typeof UserInfoResource>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const UserInfoMetaParametersResource = UserInfoMetaParametersResourceDI;
