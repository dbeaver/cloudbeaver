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

import { type AuthProviderConfiguration, AuthProvidersResource } from './AuthProvidersResource.js';
import { type IAsyncLoginOptions, type ILoginOptions, UserInfoResource } from './UserInfoResource.js';
import { AsyncTaskInfoService } from '@cloudbeaver/core-root';

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
    private readonly authProvidersResource: AuthProvidersResource,
    private readonly windowsService: WindowsService,
    private readonly asyncTaskInfoService: AsyncTaskInfoService,
  ) {}

  async login(providerId: string, options: ILoginOptions): Promise<UserInfo | null> {
    await this.userInfoResource.login(providerId, options);
    return this.userInfoResource.data;
  }

  asyncLogin(providerId: string, options: IAsyncLoginOptions): ITask<UserInfo | null> {
    const task = this.asyncTaskInfoService.create(async () => {
      const result = await this.userInfoResource.asyncAuthLogin(providerId, options);

      let window: Window | null = null;
      let id = providerId;

      if (options.configurationId) {
        const configuration = this.authProvidersResource.getConfiguration(providerId, options.configurationId);

        if (configuration) {
          id = configuration.id;
        }
      }

      if (result.redirectLink) {
        id = uuid();
        window = this.windowsService.open(id, {
          url: result.redirectLink,
          target: id,
          width: 600,
          height: 700,
        });

        if (window) {
          window.focus();
        }
      }

      return result.taskInfo;
    });

    return new AutoRunningTask(
      async () => {
        const info = await this.asyncTaskInfoService.run(task);
        await this.userInfoResource.getAuthTaskResult(info.id);

        if (window) {
          this.windowsService.close(window);
        }

        return this.userInfoResource.data;
      },
      () => this.asyncTaskInfoService.cancel(task.id),
    );
  }
}
