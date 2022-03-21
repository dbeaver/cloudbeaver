/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { AdministrationScreenService } from '@cloudbeaver/core-administration';
import { AppAuthService, AuthInfoService, AuthProviderContext, AuthProviderService, AuthProvidersResource, AUTH_PROVIDER_LOCAL_ID, UserInfoResource } from '@cloudbeaver/core-authentication';
import { injectable, Bootstrap } from '@cloudbeaver/core-di';
import type { DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import type { IExecutorHandler } from '@cloudbeaver/core-executor';
import { ServerConfigResource, SessionDataResource } from '@cloudbeaver/core-root';
import { ScreenService } from '@cloudbeaver/core-routing';
import type { ObjectOrigin } from '@cloudbeaver/core-sdk';
import { openCenteredPopup } from '@cloudbeaver/core-utils';

import { AuthDialogService } from './Dialog/AuthDialogService';

@injectable()
export class AuthenticationService extends Bootstrap {
  configureAuthProvider: (() => void) | null;
  configureIdentityProvider: (() => void) | null;

  private authPromise: Promise<DialogueStateResult | null> | null;

  constructor(
    private readonly screenService: ScreenService,
    private readonly appAuthService: AppAuthService,
    private readonly authDialogService: AuthDialogService,
    private readonly userInfoResource: UserInfoResource,
    private readonly notificationService: NotificationService,
    private readonly administrationScreenService: AdministrationScreenService,
    private readonly authProviderService: AuthProviderService,
    private readonly authProvidersResource: AuthProvidersResource,
    private readonly sessionDataResource: SessionDataResource,
    private readonly authInfoService: AuthInfoService,
    private readonly serverConfigResource: ServerConfigResource,
  ) {
    super();
    this.authPromise = null;
    this.configureAuthProvider = null;
    this.configureIdentityProvider = null;
  }

  setConfigureAuthProvider(action: () => void): void {
    this.configureAuthProvider = action;
  }

  setConfigureIdentityProvider(action: () => void): void {
    this.configureIdentityProvider = action;
  }

  async authUser(provider: string | null = null, link?: boolean): Promise<void> {
    await this.auth(false, provider, link);
  }

  async logout(): Promise<void> {
    if (this.authInfoService.userAuthConfigurations.length > 0) {
      const userAuthConfiguration = this.authInfoService.userAuthConfigurations[0];

      if (userAuthConfiguration.signOutLink) {
        this.logoutConfiguration(userAuthConfiguration.id, true);
      }
    }

    try {
      await this.userInfoResource.logout();

      if (!this.administrationScreenService.isConfigurationMode) {
        this.screenService.navigateToRoot();
      }
    } catch (exception: any) {
      this.notificationService.logException(exception, 'Can\'t logout');
    }
  }

  logoutConfiguration(configurationId: string, full: boolean): void {
    const userAuthConfiguration = this.authInfoService.userAuthConfigurations
      .find(configuration => configuration.id === configurationId);

    if (userAuthConfiguration?.signOutLink) {
      const popup = openCenteredPopup(userAuthConfiguration.signOutLink, `${userAuthConfiguration.id}-sign-out`, 600, 700, undefined);

      if (popup) {
        popup.blur();
        window.focus();
      }

      if (!full) {
        let maxTime = 1000 / 100 * 10;

        const interval = setInterval(() => {
          if (popup?.location.href !== userAuthConfiguration.signOutLink || maxTime === 0) {
            this.userInfoResource.markOutdated();
            clearInterval(interval);
          }
          maxTime--;
        }, 100);
      }
    }
  }

  private async auth(persistent: boolean, provider: string | null = null, link?: boolean) {
    if (this.authPromise) {
      return this.authPromise;
    }

    this.authPromise = this.authDialogService.showLoginForm(persistent, provider, link);

    if (this.serverConfigResource.redirectOnFederatedAuth) {
      await this.authProvidersResource.loadAll();

      const providers = this.authProvidersResource
        .getEnabledProviders();

      if (providers.length === 1) {
        const configurableProvider = providers.find(provider => provider.configurable);

        if (configurableProvider?.configurations?.length === 1) {
          const user = await this.authInfoService.sso(configurableProvider.id, configurableProvider.configurations[0]);

          if (user) {
            this.authDialogService.closeLoginForm(this.authPromise);
          }
        }
      }
    }

    try {
      return await this.authPromise;
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
    // this.sessionDataResource.beforeLoad.addHandler(
    //   ExecutorInterrupter.interrupter(() => this.appAuthService.isAuthNeeded())
    // );
    this.sessionDataResource.onDataUpdate.addPostHandler(() => { this.requireAuthentication(); });
    this.screenService.routeChange.addHandler(() => this.requireAuthentication());

    this.administrationScreenService.ensurePermissions.addHandler(async () => {
      const userInfo = await this.userInfoResource.load(undefined, []);
      if (userInfo) {
        return;
      }

      await this.auth(false, null, true);
    });
    this.authProviderService.requestAuthProvider.addHandler(this.requestAuthProviderHandler);
  }

  load(): void { }

  private readonly requestAuthProviderHandler: IExecutorHandler<ObjectOrigin> = async (data, contexts) => {
    if (data.type === AUTH_PROVIDER_LOCAL_ID) {
      const provider = contexts.getContext(AuthProviderContext);
      provider.auth();
      return;
    }

    await this.authProvidersResource.loadAll();
    await this.userInfoResource.load(undefined, []);

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
