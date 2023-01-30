/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';

import { AdministrationScreenService } from '@cloudbeaver/core-administration';
import { AppAuthService, AuthInfoService, AuthProviderContext, AuthProviderService, AuthProvidersResource, AUTH_PROVIDER_LOCAL_ID, IUserAuthConfiguration, RequestedProvider, UserInfoResource } from '@cloudbeaver/core-authentication';
import { injectable, Bootstrap } from '@cloudbeaver/core-di';
import type { DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { Executor, ExecutorInterrupter, IExecutionContextProvider, IExecutorHandler } from '@cloudbeaver/core-executor';
import { ISessionAction, ServerConfigResource, sessionActionContext, SessionActionService, SessionDataResource } from '@cloudbeaver/core-root';
import { ScreenService } from '@cloudbeaver/core-routing';
import { NavigationService, WindowsService } from '@cloudbeaver/core-ui';

import { AuthDialogService } from './Dialog/AuthDialogService';
import type { IAuthOptions } from './IAuthOptions';
import { isAutoLoginSessionAction } from './isAutoLoginSessionAction';

type AuthEventType = 'before' | 'after';

@injectable()
export class AuthenticationService extends Bootstrap {
  readonly onLogout: Executor<AuthEventType>;
  readonly onLogin: Executor<AuthEventType>;

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
    private readonly windowsService: WindowsService,
    private readonly sessionActionService: SessionActionService,
    private readonly navigationService: NavigationService,
  ) {
    super();

    this.onLogout = new Executor();
    this.onLogin = new Executor();

    this.onLogout.before(this.navigationService.navigationTask);

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

  async authUser(providerId: string | null = null, linkUser?: boolean): Promise<void> {
    await this.auth(false, { providerId, linkUser });
  }

  async logout(providerId?: string, configurationId?: string): Promise<void> {
    const contexts = await this.onLogout.execute('before');

    if (ExecutorInterrupter.isInterrupted(contexts)) {
      return;
    }

    let userAuthConfiguration: IUserAuthConfiguration | undefined = undefined;

    if (providerId) {
      userAuthConfiguration = this.authInfoService.userAuthConfigurations
        .find(c => c.providerId === providerId && c.configuration.id === configurationId);
    } else if (this.authInfoService.userAuthConfigurations.length > 0) {
      userAuthConfiguration = this.authInfoService.userAuthConfigurations[0];
    }

    if (userAuthConfiguration?.configuration.signOutLink) {
      this.logoutConfiguration(userAuthConfiguration);
    }

    try {
      await this.userInfoResource.logout(providerId, configurationId);

      if (!this.administrationScreenService.isConfigurationMode && !providerId) {
        this.screenService.navigateToRoot();
      }

      await this.onLogout.execute('after');
    } catch (exception: any) {
      this.notificationService.logException(exception, 'Can\'t logout');
    }
  }

  private async logoutConfiguration(configuration: IUserAuthConfiguration): Promise<void> {
    if (configuration.configuration.signOutLink) {
      const id = `${configuration.configuration.id}-sign-out`;
      const popup = this.windowsService.open(id, {
        url: configuration.configuration.signOutLink,
        target: id,
        width: 600,
        height: 700,
      });

      if (popup) {
        popup.blur();
        window.focus();
      }
    }
  }

  private async auth(persistent: boolean, options: IAuthOptions) {
    const contexts = await this.onLogin.execute('before');

    if (ExecutorInterrupter.isInterrupted(contexts)) {
      return;
    }

    if (this.authPromise) {
      await this.authPromise;
      return;
    }

    options = observable(options);

    this.authPromise = this.authDialogService.showLoginForm(persistent, options)
      .then(async state => {
        await this.onLogin.execute('after');
        return state;
      });

    if (this.serverConfigResource.redirectOnFederatedAuth) {
      await this.authProvidersResource.loadAll();

      const providers = this.authProvidersResource
        .getEnabledProviders();

      if (providers.length === 1) {
        const configurableProvider = providers.find(provider => provider.configurable);

        if (configurableProvider?.configurations?.length === 1) {
          const configuration = configurableProvider.configurations[0];

          options.providerId = configurableProvider.id;
          options.configurationId = configuration.id;
        }
      }
    }

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

    await this.auth(true, { accessRequest: true, providerId: null, linkUser: false });
  }

  register(): void {
    // this.sessionDataResource.beforeLoad.addHandler(
    //   ExecutorInterrupter.interrupter(() => this.appAuthService.isAuthNeeded())
    // );

    this.sessionActionService.onAction.addHandler(this.authSessionAction.bind(this));
    this.sessionDataResource.onDataUpdate.addPostHandler(() => { this.requireAuthentication(); });
    this.screenService.routeChange.addHandler(() => this.requireAuthentication());

    this.administrationScreenService.ensurePermissions.addHandler(async () => {
      const userInfo = await this.userInfoResource.load();
      if (userInfo) {
        return;
      }

      await this.auth(false, { providerId: null, linkUser: false, accessRequest: true });
    });
    this.authProviderService.requestAuthProvider.addHandler(this.requestAuthProviderHandler);
  }

  load(): void { }

  private async authSessionAction(
    data: ISessionAction | null,
    contexts: IExecutionContextProvider<ISessionAction | null>
  ) {
    const action = contexts.getContext(sessionActionContext);

    if (isAutoLoginSessionAction(data)) {
      const user = await this.userInfoResource.finishFederatedAuthentication(data['auth-id'], false);

      if (user && this.authPromise) {
        this.authDialogService.closeLoginForm(this.authPromise);
      }
      action.process();
    }
  }

  private readonly requestAuthProviderHandler: IExecutorHandler<RequestedProvider> = async (data, contexts) => {
    if (data.providerId === AUTH_PROVIDER_LOCAL_ID) {
      const provider = contexts.getContext(AuthProviderContext);
      provider.auth();
      return;
    }

    await this.authProvidersResource.loadAll();
    await this.userInfoResource.load();

    if (!this.authProvidersResource.has(data.providerId)) {
      return;
    }

    if (!this.userInfoResource.hasToken(data.providerId)) {
      await this.auth(false, { providerId: data.providerId });
    }

    if (this.userInfoResource.hasToken(data.providerId)) {
      const provider = contexts.getContext(AuthProviderContext);
      provider.auth();
    }
  };
}
