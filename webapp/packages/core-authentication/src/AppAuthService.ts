/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable, Bootstrap } from '@cloudbeaver/core-di';
import { Executor, IExecutor } from '@cloudbeaver/core-executor';
import { ServerService, SessionService } from '@cloudbeaver/core-root';

import { UserInfoResource } from './UserInfoResource';

@injectable()
export class AppAuthService extends Bootstrap {
  get authenticated(): boolean {
    const config = this.serverService.config.data;
    const user = this.userInfoResource.data;

    return !!config?.anonymousAccessEnabled
    || !!config?.configurationMode
    || user !== null;
  }

  readonly auth: IExecutor<boolean>;
  constructor(
    private serverService: ServerService,
    private sessionService: SessionService,
    private userInfoResource: UserInfoResource,
  ) {
    super();
    this.auth = new Executor();
    this.sessionService.session.onDataUpdate.addHandler(async () => { await this.authUser(); });
  }

  async isAuthNeeded(): Promise<boolean> {
    const config = await this.serverService.config.load();
    if (!config) {
      throw new Error('Can\'t configure Authentication');
    }

    const user = await this.userInfoResource.load();

    return !!config.authenticationEnabled
      && !config.configurationMode
      && !config.anonymousAccessEnabled
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
