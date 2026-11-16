/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { Executor, ExecutorInterrupter, type IExecutor } from '@cloudbeaver/core-executor';
import { type CachedDataResourceKey, CachedResource, getCachedDataResourceLoaderState } from '@cloudbeaver/core-resource';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import type { ILoadableState } from '@cloudbeaver/core-utils';

import { UserInfoResource } from './UserInfoResource.js';

export class AppAuthServiceImpl {
  get authenticated(): boolean {
    return this.serverConfigResource.configurationMode || this.userInfoResource.hasAccess();
  }

  get loaders(): ILoadableState[] {
    return [
      getCachedDataResourceLoaderState(this.userInfoResource, () => undefined),
      getCachedDataResourceLoaderState(this.serverConfigResource, () => undefined),
    ];
  }

  readonly auth: IExecutor<boolean>;

  constructor(
    private readonly serverConfigResource: ServerConfigResource,
    private readonly userInfoResource: UserInfoResource,
  ) {
    this.auth = new Executor();
    this.userInfoResource.onDataUpdate.addHandler(this.authUser.bind(this));
  }

  requireAuthentication<T = CachedDataResourceKey<UserInfoResource>>(
    resource: CachedResource<any, any, T, any, any>,
    map?: (param: T | undefined) => T,
  ): this {
    resource.preloadResource(this.userInfoResource, () => {}).before(ExecutorInterrupter.interrupter(() => !this.authenticated));

    this.userInfoResource.outdateResource<T>(resource, map as any);

    return this;
  }

  async isAuthNeeded(): Promise<boolean> {
    const config = await this.serverConfigResource.load();

    if (!config) {
      throw new Error("Can't configure Authentication");
    }

    await this.userInfoResource.load();

    return !this.serverConfigResource.configurationMode && !this.userInfoResource.hasAccess();
  }

  async authUser(): Promise<boolean> {
    const userInfo = await this.userInfoResource.load();

    const state = userInfo !== null;
    await this.auth.execute(state);

    return state;
  }
}

export type AppAuthService = AppAuthServiceImpl;

export class AppAuthServiceDI extends Context.Service<AppAuthServiceDI, AppAuthServiceImpl>()(
  '@cloudbeaver/core-authentication/AppAuthService#AppAuthService',
) {
  static readonly implementation = AppAuthServiceImpl;

  static readonly dependencies = () => [ServerConfigResource, UserInfoResource] as const;
  static readonly make: Effect.Effect<
    AppAuthServiceImpl,
    never,
    Context.Service.Identifier<typeof ServerConfigResource> | Context.Service.Identifier<typeof UserInfoResource>
  > = Effect.gen(function* makeAppAuthService() {
    const serverConfigResource = yield* ServerConfigResource;
    const userInfoResource = yield* UserInfoResource;

    return new AppAuthServiceImpl(serverConfigResource, userInfoResource);
  });
  static readonly layer: Layer.Layer<
    AppAuthServiceDI,
    never,
    Context.Service.Identifier<typeof ServerConfigResource> | Context.Service.Identifier<typeof UserInfoResource>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const AppAuthService = AppAuthServiceDI;
