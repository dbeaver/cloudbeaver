/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';

import { UserConfigurationService } from './UserConfiguration/UserConfigurationService.js';
import { UserInfoResource } from './UserInfoResource.js';

export class UserConfigurationBootstrapImpl extends Bootstrap {
  constructor(
    private readonly userInfoResource: UserInfoResource,
    private readonly userConfigurationService: UserConfigurationService,
  ) {
    super();
  }

  override register(): void {
    this.userConfigurationService.register();
  }

  override async load(): Promise<void> {
    await this.userInfoResource.load();
  }
}

export type UserConfigurationBootstrap = UserConfigurationBootstrapImpl;

export class UserConfigurationBootstrapDI extends Context.Service<UserConfigurationBootstrapDI, UserConfigurationBootstrapImpl>()(
  '@cloudbeaver/core-authentication/UserConfigurationBootstrap#UserConfigurationBootstrap',
) {
  static readonly implementation = UserConfigurationBootstrapImpl;
  static readonly dependencies = () => [UserInfoResource, UserConfigurationService] as const;
  static readonly make: Effect.Effect<
    UserConfigurationBootstrapImpl,
    never,
    Context.Service.Identifier<typeof UserInfoResource> | Context.Service.Identifier<typeof UserConfigurationService>
  > = Effect.gen(function* makeUserConfigurationBootstrap() {
    const userInfoResource = yield* UserInfoResource;
    const userConfigurationService = yield* UserConfigurationService;
    return new UserConfigurationBootstrapImpl(userInfoResource, userConfigurationService);
  });
  static readonly layer: Layer.Layer<
    UserConfigurationBootstrapDI,
    never,
    Context.Service.Identifier<typeof UserInfoResource> | Context.Service.Identifier<typeof UserConfigurationService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const UserConfigurationBootstrap = UserConfigurationBootstrapDI;
