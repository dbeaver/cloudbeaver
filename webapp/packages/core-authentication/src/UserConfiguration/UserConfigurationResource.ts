/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { CachedDataResource } from '@cloudbeaver/core-resource';
import { GraphQLService } from '@cloudbeaver/core-sdk';

import type { UserData } from '../IUserDataStorage.js';
import { UserInfoResource } from '../UserInfoResource.js';

export class UserConfigurationResourceImpl extends CachedDataResource<UserData> {
  constructor(
    private readonly graphQLService: GraphQLService,
    userInfoResource: UserInfoResource,
  ) {
    super(() => ({}));

    this.sync(userInfoResource);
    userInfoResource.onUserChange.addHandler(() => this.clear());
  }

  async saveConfiguration(configuration: UserData): Promise<void> {
    await this.performUpdate(undefined, [], async () => {
      const { configuration: savedConfiguration } = await this.graphQLService.sdk.authSetUserConfiguration({ configuration });

      this.setData(savedConfiguration);
    });
  }

  protected async loader(): Promise<UserData> {
    const { user } = await this.graphQLService.sdk.getUserConfiguration();

    return user?.userConfiguration ?? {};
  }
}

export type UserConfigurationResource = UserConfigurationResourceImpl;

export class UserConfigurationResourceDI extends Context.Service<UserConfigurationResourceDI, UserConfigurationResourceImpl>()(
  '@cloudbeaver/core-authentication/UserConfiguration/UserConfigurationResource#UserConfigurationResource',
) {
  static readonly implementation = UserConfigurationResourceImpl;
  static readonly dependencies = () => [GraphQLService, UserInfoResource] as const;
  static readonly make: Effect.Effect<
    UserConfigurationResourceImpl,
    never,
    Context.Service.Identifier<typeof GraphQLService> | Context.Service.Identifier<typeof UserInfoResource>
  > = Effect.gen(function* makeUserConfigurationResource() {
    const graphQLService = yield* GraphQLService;
    const userInfoResource = yield* UserInfoResource;

    return new UserConfigurationResourceImpl(graphQLService, userInfoResource);
  });
  static readonly layer: Layer.Layer<
    UserConfigurationResourceDI,
    never,
    Context.Service.Identifier<typeof GraphQLService> | Context.Service.Identifier<typeof UserInfoResource>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const UserConfigurationResource = UserConfigurationResourceDI;
