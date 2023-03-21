/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable, Bootstrap } from '@cloudbeaver/core-di';
import { Executor, ExecutorInterrupter, IExecutor } from '@cloudbeaver/core-executor';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import { CachedDataResourceKey, CachedResource, getCachedDataResourceLoaderState } from '@cloudbeaver/core-sdk';
import type { ILoadableState } from '@cloudbeaver/core-utils';

import { UserInfoResource } from './UserInfoResource';

@injectable()
export class AppAuthService extends Bootstrap {
  get authenticated(): boolean {
    const user = this.userInfoResource.data;

    return (
      this.serverConfigResource.anonymousAccessEnabled
      || this.serverConfigResource.configurationMode
      || user !== null
    );
  }

  get loaders(): ILoadableState[] {
    return [
      getCachedDataResourceLoaderState(this.userInfoResource, undefined),
      getCachedDataResourceLoaderState(this.serverConfigResource, undefined),
    ];
  }

  readonly auth: IExecutor<boolean>;

  constructor(
    private readonly serverConfigResource: ServerConfigResource,
    private readonly userInfoResource: UserInfoResource,
  ) {
    super();
    this.auth = new Executor();
    this.userInfoResource.onDataUpdate.addHandler(this.authUser.bind(this));
  }

  requireAuthentication<T = CachedDataResourceKey<UserInfoResource>>(
    resource: CachedResource<any, any, T, any, any>,
    map?: (param: T | undefined) => T
  ): this {
    resource
      .preloadResource(this.userInfoResource, () => {})
      .preloadResource(this.serverConfigResource, () => {})
      .before(ExecutorInterrupter.interrupter(() => !this.authenticated));

    this.userInfoResource.outdateResource<T>(resource, map as any);

    return this;
  }

  async isAuthNeeded(): Promise<boolean> {
    const config = await this.serverConfigResource.load();
    if (!config) {
      throw new Error('Can\'t configure Authentication');
    }

    const user = await this.userInfoResource.load();

    return !this.serverConfigResource.configurationMode
      && !this.serverConfigResource.anonymousAccessEnabled
      && user === null;
  }

  async authUser(): Promise<boolean> {
    const userInfo = await this.userInfoResource.load();

    const state = userInfo !== null;
    await this.auth.execute(state);
    return state;
  }

  register(): void { }

  load(): void { }
}
