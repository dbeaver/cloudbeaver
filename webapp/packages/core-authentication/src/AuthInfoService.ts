/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { AutoRunningTask, type ITask } from '@cloudbeaver/core-executor';
import { AsyncTaskInfoService } from '@cloudbeaver/core-root';
import { WindowsService } from '@cloudbeaver/core-routing';
import { type UserInfo } from '@cloudbeaver/core-sdk';
import { uuid } from '@cloudbeaver/core-utils';

import { type AuthProviderConfiguration } from './AuthProvidersResource.js';
import { type IFederatedLoginOptions, type ILoginOptions, UserInfoResource } from './UserInfoResource.js';

export interface IUserAuthConfiguration {
  providerId: string;
  configuration: AuthProviderConfiguration;
}

export class AuthInfoServiceImpl {
  get userInfo(): UserInfo | null {
    return this.userInfoResource.data;
  }

  constructor(
    private readonly userInfoResource: UserInfoResource,
    private readonly windowsService: WindowsService,
    private readonly asyncTaskInfoService: AsyncTaskInfoService,
  ) {}

  async login(providerId: string, options: ILoginOptions): Promise<UserInfo | null> {
    await this.userInfoResource.login(providerId, options);
    return this.userInfoResource.data;
  }

  federatedLogin(providerId: string, options: IFederatedLoginOptions): ITask<UserInfo | null> {
    let redirectWindow: Window | null = null;

    const task = this.asyncTaskInfoService.create(async () => {
      const result = await this.userInfoResource.requestFederatedLogin(providerId, options);

      if (result.redirectLink) {
        const id = uuid();
        redirectWindow = this.windowsService.open(id, {
          url: result.redirectLink,
          target: id,
          width: 600,
          height: 700,
        });

        if (redirectWindow) {
          redirectWindow.focus();
        }
      }

      return result.taskInfo;
    });

    return new AutoRunningTask(
      async () => {
        await this.asyncTaskInfoService.run(task);
        await this.userInfoResource.syncData();

        if (redirectWindow) {
          this.windowsService.close(redirectWindow);
        }

        return this.userInfoResource.data;
      },
      () => this.asyncTaskInfoService.cancel(task.id),
    );
  }
}

export type AuthInfoService = AuthInfoServiceImpl;

export class AuthInfoServiceDI extends Context.Service<AuthInfoServiceDI, AuthInfoServiceImpl>()(
  '@cloudbeaver/core-authentication/AuthInfoService#AuthInfoService',
) {
  static readonly implementation = AuthInfoServiceImpl;

  static readonly dependencies = () => [UserInfoResource, WindowsService, AsyncTaskInfoService] as const;
  static readonly make: Effect.Effect<
    AuthInfoServiceImpl,
    never,
    | Context.Service.Identifier<typeof UserInfoResource>
    | Context.Service.Identifier<typeof WindowsService>
    | Context.Service.Identifier<typeof AsyncTaskInfoService>
  > = Effect.gen(function* makeAuthInfoService() {
    const userInfoResource = yield* UserInfoResource;
    const windowsService = yield* WindowsService;
    const asyncTaskInfoService = yield* AsyncTaskInfoService;

    return new AuthInfoServiceImpl(userInfoResource, windowsService, asyncTaskInfoService);
  });
  static readonly layer: Layer.Layer<
    AuthInfoServiceDI,
    never,
    | Context.Service.Identifier<typeof UserInfoResource>
    | Context.Service.Identifier<typeof WindowsService>
    | Context.Service.Identifier<typeof AsyncTaskInfoService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const AuthInfoService = AuthInfoServiceDI;
