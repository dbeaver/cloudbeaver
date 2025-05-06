/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observable } from 'mobx';

import { AdministrationScreenService } from '@cloudbeaver/core-administration';
import {
  AppAuthService,
  AUTH_PROVIDER_LOCAL_ID,
  AuthProviderContext,
  AuthProviderService,
  AuthProvidersResource,
  type RequestedProvider,
  UserInfoResource,
  type UserLogoutInfo,
} from '@cloudbeaver/core-authentication';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { Executor, ExecutorInterrupter, type IExecutionContextProvider, type IExecutorHandler } from '@cloudbeaver/core-executor';
import { CachedMapAllKey } from '@cloudbeaver/core-resource';
import { type ISessionAction, ServerConfigResource, sessionActionContext, SessionActionService, SessionDataResource } from '@cloudbeaver/core-root';
import { ScreenService, WindowsService } from '@cloudbeaver/core-routing';
import { NavigationService } from '@cloudbeaver/core-ui';
import { uuid } from '@cloudbeaver/core-utils';

import { AuthDialogService } from './Dialog/AuthDialogService.js';
import type { IAuthOptions } from './IAuthOptions.js';
import { isAutoLoginSessionAction } from './isAutoLoginSessionAction.js';

export type AuthEventType = 'before' | 'after';

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
    private readonly serverConfigResource: ServerConfigResource,
    private readonly windowsService: WindowsService,
    private readonly sessionActionService: SessionActionService,
    private readonly navigationService: NavigationService,
  ) {
    super();

    this.onLogout = new Executor();
    this.onLogin = new Executor();

    this.onLogout.before(this.navigationService.navigationTask);
    this.onLogin.before(this.navigationService.navigationTask, undefined, () => userInfoResource.isAnonymous());

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

    try {
      const logoutResult = await this.userInfoResource.logout(providerId, configurationId);

      this.handleRedirectLinks(logoutResult.result);

      if (!this.administrationScreenService.isConfigurationMode && !providerId) {
        this.screenService.navigateToRoot();
      }

      await this.onLogout.execute('after');
    } catch (exception: any) {
      this.notificationService.logException(exception, 'authentication_logout_error');
    }
  }

  // TODO handle all redirect links once we know what to do with multiple popups issue
  private handleRedirectLinks(userLogoutInfo: UserLogoutInfo) {
    const redirectLinks = userLogoutInfo.redirectLinks;

    if (redirectLinks.length) {
      const url = redirectLinks[0];
      const id = `okta-logout-id-${uuid()}`;

      const popup = this.windowsService.open(id, {
        url,
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
    if (this.authPromise) {
      await this.waitAuth();
      return;
    }

    const contexts = await this.onLogin.execute('before');

    if (ExecutorInterrupter.isInterrupted(contexts)) {
      return;
    }

    options = observable(options);

    if (this.serverConfigResource.redirectOnFederatedAuth) {
      await this.authProvidersResource.load(CachedMapAllKey);

      const providers = this.authProvidersResource.getEnabledProviders();

      if (providers.length === 1) {
        const configurableProvider = providers.find(provider => provider.configurable);

        if (configurableProvider?.configurations?.length === 1) {
          const configuration = configurableProvider.configurations[0]!;

          options.providerId = configurableProvider.id;
          options.configurationId = configuration.id;
        }
      }
    }

    if (this.authPromise) {
      await this.waitAuth();
      return;
    }

    this.authPromise = this.authDialogService
      .showLoginForm(persistent, options)
      .then(async state => {
        if (state === DialogueStateResult.Rejected) {
          return state;
        }
        await this.onLogin.execute('after');
        return state;
      })
      .finally(() => {
        this.authPromise = null;
      });

    await this.authPromise;
  }

  private async requireAuthentication() {
    await this.waitAuth();

    const authNeeded = await this.appAuthService.isAuthNeeded();
    if (!authNeeded) {
      return;
    }

    await this.auth(true, { accessRequest: true, providerId: null, linkUser: false });
  }

  override register(): void {
    // this.sessionDataResource.beforeLoad.addHandler(
    //   ExecutorInterrupter.interrupter(() => this.appAuthService.isAuthNeeded())
    // );

    this.sessionActionService.onAction.addHandler(this.authSessionAction.bind(this));
    this.sessionDataResource.onDataUpdate.addPostHandler(() => {
      this.requireAuthentication();
    });
    this.screenService.routeChange.addHandler(() => this.requireAuthentication());

    this.administrationScreenService.ensurePermissions.addHandler(async () => {
      await this.waitAuth();

      await this.userInfoResource.load();
      if (this.userInfoResource.isAuthenticated()) {
        return;
      }

      await this.auth(false, { providerId: null, linkUser: false, accessRequest: true });
    });
    this.authProviderService.requestAuthProvider.addHandler(this.requestAuthProviderHandler);
  }

  private async authSessionAction(data: ISessionAction | null, contexts: IExecutionContextProvider<ISessionAction | null>) {
    const action = contexts.getContext(sessionActionContext);

    if (isAutoLoginSessionAction(data)) {
      const user = await this.userInfoResource.autoLogin(data['auth-id'], false);

      if (user) {
        //we request this method/request bc login form can be opened automatically.
        //in case when authentication is required,
        //loin form may be opened and we need to close it
        this.authDialogService.closeLoginForm();
      }
      action.process();
    }
  }

  private readonly requestAuthProviderHandler: IExecutorHandler<RequestedProvider> = async (data, contexts) => {
    await this.waitAuth();

    if (data.providerId === AUTH_PROVIDER_LOCAL_ID) {
      const provider = contexts.getContext(AuthProviderContext);
      provider.auth();
      return;
    }

    await this.authProvidersResource.load();
    await this.userInfoResource.load();

    if (!this.authProvidersResource.has(data.providerId)) {
      return;
    }

    if (!this.userInfoResource.hasToken(data.providerId)) {
      await this.auth(false, { providerId: data.providerId, configurationId: data.configurationId });
    }

    if (this.userInfoResource.hasToken(data.providerId)) {
      const provider = contexts.getContext(AuthProviderContext);
      provider.auth();
    }
  };

  private async waitAuth() {
    try {
      await this.authPromise;
    } catch {}
  }
}
