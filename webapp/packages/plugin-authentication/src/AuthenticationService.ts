/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { AdministrationScreenService } from '@cloudbeaver/core-administration';
import { AppAuthService, AuthProviderContext, AuthProviderService, AuthProvidersResource, AUTH_PROVIDER_LOCAL_ID, UserInfoResource } from '@cloudbeaver/core-authentication';
import { injectable, Bootstrap } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { ExecutorInterrupter, IExecutorHandler } from '@cloudbeaver/core-executor';
import { SessionDataResource } from '@cloudbeaver/core-root';
import { ScreenService } from '@cloudbeaver/core-routing';
import type { ObjectOrigin } from '@cloudbeaver/core-sdk';

import { AuthDialogService } from './Dialog/AuthDialogService';

@injectable()
export class AuthenticationService extends Bootstrap {
  private authPromise: Promise<void> | null;
  constructor(
    private screenService: ScreenService,
    private appAuthService: AppAuthService,
    private authDialogService: AuthDialogService,
    private userInfoResource: UserInfoResource,
    private notificationService: NotificationService,
    private readonly administrationScreenService: AdministrationScreenService,
    private readonly authProviderService: AuthProviderService,
    private readonly authProvidersResource: AuthProvidersResource,
    private readonly sessionDataResource: SessionDataResource,
  ) {
    super();
    this.authPromise = null;
  }

  async authUser(provider: string | null = null, link?: boolean): Promise<void> {
    await this.auth(false, provider, link);
  }

  async logout(): Promise<void> {
    try {
      await this.userInfoResource.logout();

      if (!this.administrationScreenService.isConfigurationMode) {
        this.screenService.navigateToRoot();
      }
    } catch (exception) {
      this.notificationService.logException(exception, 'Can\'t logout');
    }
  }

  private async auth(persistent: boolean, provider: string | null = null, link?: boolean) {
    if (this.authPromise) {
      return this.authPromise;
    }
    this.authPromise = this.authDialogService.showLoginForm(persistent, provider, link);
    try {
      await this.authPromise;
    } finally {
      this.authPromise = null;
    }
  }

  private async requireAuthentication() {
    const authNeeded = await this.appAuthService.isAuthNeeded();
    if (!authNeeded) {
      return;
    }

    await this.auth(true, null, true);
  }

  register(): void {
    this.sessionDataResource.beforeLoad.addHandler(
      ExecutorInterrupter.interrupter(() => this.appAuthService.isAuthNeeded())
    );
    this.sessionDataResource.beforeLoad.addPostHandler(() => { this.requireAuthentication(); });
    this.screenService.routeChange.addHandler(() => this.requireAuthentication());

    this.administrationScreenService.ensurePermissions.addHandler(async () => {
      const userInfo = await this.userInfoResource.load();
      if (userInfo) {
        return;
      }

      await this.auth(false, null, true);
    });
    this.authProviderService.requestAuthProvider.addHandler(this.requestAuthProviderHandler);
  }

  load(): void { }

  private requestAuthProviderHandler: IExecutorHandler<ObjectOrigin> = async (data, contexts) => {
    if (data.type === AUTH_PROVIDER_LOCAL_ID) {
      const provider = contexts.getContext(AuthProviderContext);
      provider.auth();
      return;
    }

    await this.authProvidersResource.loadAll();
    await this.userInfoResource.load();

    if (!this.authProvidersResource.has(data.subType ?? data.type)) {
      return;
    }

    if (!this.userInfoResource.hasToken(data.type, data.subType)) {
      await this.auth(false, data.subType ?? data.type);
    }

    if (this.userInfoResource.hasToken(data.type, data.subType)) {
      const provider = contexts.getContext(AuthProviderContext);
      provider.auth();
    }
  };
}
