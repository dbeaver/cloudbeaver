/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { AutoRunningTask, type ITask } from '@cloudbeaver/core-executor';
import { WindowsService } from '@cloudbeaver/core-routing';
import { type UserInfo } from '@cloudbeaver/core-sdk';
import { uuid } from '@cloudbeaver/core-utils';
import { AsyncTaskInfoService } from '@cloudbeaver/core-root';

import { type AuthProviderConfiguration } from './AuthProvidersResource.js';
import { type IFederatedLoginOptions, type ILoginOptions, UserInfoResource } from './UserInfoResource.js';

export interface IUserAuthConfiguration {
  providerId: string;
  configuration: AuthProviderConfiguration;
}

@injectable()
export class AuthInfoService {
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
