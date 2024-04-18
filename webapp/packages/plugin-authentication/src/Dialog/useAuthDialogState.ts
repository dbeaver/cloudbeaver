/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, computed, observable, untracked } from 'mobx';
import { useEffect } from 'react';

import { AdministrationScreenService } from '@cloudbeaver/core-administration';
import { AuthInfoService, AuthProvider, AuthProviderConfiguration, AuthProvidersResource, IAuthCredentials } from '@cloudbeaver/core-authentication';
import { ConfirmationDialog, useObservableRef, useResource } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import type { ITask } from '@cloudbeaver/core-executor';
import { CachedMapAllKey } from '@cloudbeaver/core-resource';
import { EServerErrorCode, GQLError, type UserInfo } from '@cloudbeaver/core-sdk';
import { errorOf, isArraysEqual } from '@cloudbeaver/core-utils';

import { FEDERATED_AUTH } from './FEDERATED_AUTH';

interface IData {
  state: IState;
  exception: Error | null;
  exceptionMap: Map<string, Error>;
  setException: (value: Error) => void;
  authenticating: boolean;
  authTask: ITask<UserInfo | null> | null;
  destroyed: boolean;
  configure: boolean;
  adminPageActive: boolean;
  providers: AuthProvider[];
  federatedProviders: AuthProvider[];
  tabIds: string[];

  login: (linkUser: boolean, provider?: AuthProvider, configuration?: AuthProviderConfiguration) => Promise<boolean>;
  loginFederated: (provider: AuthProvider, configuration: AuthProviderConfiguration, onClose?: () => void) => Promise<void>;
}

interface IState {
  tabId: string | null;
  activeProvider: AuthProvider | null;
  activeConfiguration: AuthProviderConfiguration | null;
  credentials: IAuthCredentials;
  tabIds: string[];
  tooManySessions: Map<string, boolean>;
  forceSessionsLogout: Map<string, boolean>;
  isTooManySessions: boolean;
  isForceSessionsLogout: boolean;
  setTooManySessions: (value: boolean) => void;
  setForceSessionsLogout: (value: boolean) => void;
  setTabId: (tabId: string | null) => void;
  setActiveProvider: (provider: AuthProvider | null, configuration: AuthProviderConfiguration | null) => void;
}

export function useAuthDialogState(accessRequest: boolean, providerId: string | null, configurationId?: string): IData {
  const authProvidersResource = useResource(useAuthDialogState, AuthProvidersResource, CachedMapAllKey);
  const administrationScreenService = useService(AdministrationScreenService);
  const authInfoService = useService(AuthInfoService);
  const notificationService = useService(NotificationService);
  const commonDialogService = useService(CommonDialogService);

  const adminPageActive = administrationScreenService.isAdministrationPageActive;
  const providers = authProvidersResource.data.filter(notEmptyProvider).sort(compareProviders);

  const activeProviders = providers.filter(provider => {
    if (provider.federated || provider.trusted || provider.private) {
      return false;
    }

    if (provider.configurable && (provider.configurations?.length ?? 0) === 0) {
      return false;
    }

    if (providerId !== null) {
      return provider.id === providerId;
    }

    const active = authProvidersResource.resource.isAuthEnabled(provider.id);

    if (active) {
      return true;
    }

    return false;
  });

  const federatedProviders = providers.filter(
    provider =>
      provider.federated &&
      provider.configurable &&
      (provider.configurations?.length || 0) > 0 &&
      authProvidersResource.resource.isAuthEnabled(provider.id),
  );

  const tabIds = activeProviders
    .map(provider => {
      if (provider.configurable) {
        return provider.configurations?.map(configuration => getAuthProviderTabId(provider, configuration)) ?? [];
      }

      return provider.id;
    })
    .flat();

  if (federatedProviders.length > 0) {
    tabIds.push(FEDERATED_AUTH);
  }

  const state = useObservableRef<IState>(
    () => ({
      tabId: null,
      activeProvider: null,
      activeConfiguration: null,
      tabIds,
      credentials: {
        profile: '0',
        credentials: {},
      },
      tooManySessions: new Map(),
      forceSessionsLogout: new Map(),
      get isTooManySessions(): boolean {
        return this.tabId ? this.tooManySessions.get(this.tabId) ?? false : false;
      },
      get isForceSessionsLogout(): boolean {
        return this.tabId ? this.forceSessionsLogout.get(this.tabId) ?? false : false;
      },
      setTooManySessions(value: boolean): void {
        if (!this.tabId) {
          throw new Error('Can not set too many sessions for not active tab');
        }

        this.tooManySessions.set(this.tabId, value);
      },
      setForceSessionsLogout(value: boolean): void {
        if (!this.tabId) {
          throw new Error('Can not set force sessions logout for not active tab');
        }

        this.forceSessionsLogout.set(this.tabId, value);
      },
      setTabId(tabId: string | null): void {
        if (tabIds.includes(tabId as any)) {
          this.tabId = tabId;
        } else {
          this.tabId = tabIds[0] ?? null;
        }
      },
      setActiveProvider(provider: AuthProvider | null, configuration: AuthProviderConfiguration | null): void {
        const providerChanged = this.activeProvider?.id !== provider?.id;
        const configurationChanged = this.activeConfiguration?.id !== configuration?.id;

        this.activeProvider = provider;
        this.activeConfiguration = configuration;

        if (providerChanged || configurationChanged) {
          this.credentials.profile = '0';
          this.credentials.credentials = {};
        }

        if (provider) {
          if (provider.federated) {
            this.setTabId(FEDERATED_AUTH);
          } else {
            this.setTabId(getAuthProviderTabId(provider, configuration));
          }
        } else {
          this.setTabId(null);
        }
      },
    }),
    {
      tabId: observable.ref,
      activeProvider: observable.ref,
      activeConfiguration: observable.ref,
      credentials: observable,
      tooManySessions: observable.shallow,
      forceSessionsLogout: observable.shallow,
      isTooManySessions: computed,
      isForceSessionsLogout: computed,
      setTooManySessions: action.bound,
      setForceSessionsLogout: action.bound,
      setTabId: action.bound,
      setActiveProvider: action.bound,
    },
    false,
  );

  untracked(() => {
    if (!isArraysEqual(state.tabIds, tabIds, undefined, true)) {
      state.tabIds = tabIds;
    }
  });

  const data = useObservableRef<IData>(
    () => ({
      get exception() {
        if (state.tabId) {
          return this.exceptionMap.get(state.tabId) ?? null;
        }

        return null;
      },
      exceptionMap: new Map(),
      setException(value: Error): void {
        if (!state.tabId) {
          throw new Error('Can not set exception for not active tab');
        }

        this.exceptionMap.set(state.tabId, value);
      },
      authenticating: false,
      authTask: null,
      destroyed: false,

      get configure(): boolean {
        if (state.activeProvider) {
          return !authProvidersResource.resource.isAuthEnabled(state.activeProvider.id);
        }
        return false;
      },
      async login(linkUser: boolean, provider?: AuthProvider, configuration?: AuthProviderConfiguration): Promise<boolean> {
        provider = (provider || state.activeProvider) ?? undefined;
        configuration = (configuration || state.activeConfiguration) ?? undefined;

        if (!provider || this.authenticating) {
          return false;
        }

        if (state.isTooManySessions && state.isForceSessionsLogout) {
          const result = await commonDialogService.open(ConfirmationDialog, {
            title: 'authentication_auth_force_session_logout_popup_title',
            message: 'authentication_auth_force_session_logout_popup_message',
          });

          if (result === DialogueStateResult.Rejected) {
            return false;
          }
        }

        this.authenticating = true;
        state.setTooManySessions(false);

        try {
          this.state.setActiveProvider(provider, configuration ?? null);

          const loginTask = authInfoService.login(provider.id, {
            configurationId: configuration?.id,
            credentials: {
              ...state.credentials,
              credentials: {
                ...state.credentials.credentials,
                user: state.credentials.credentials.user?.trim(),
                password: state.credentials.credentials.password?.trim(),
              },
            },
            forceSessionsLogout: state.isForceSessionsLogout,
            linkUser,
          });
          this.authTask = loginTask;

          await loginTask;
        } catch (exception: any) {
          const gqlError = errorOf(exception, GQLError);

          if (gqlError?.errorCode === EServerErrorCode.tooManySessions) {
            state.setTooManySessions(true);
          }

          if (this.destroyed) {
            notificationService.logException(exception, 'Login failed');
          } else {
            this.setException(exception);
          }

          throw exception;
        } finally {
          this.authTask = null;
          this.authenticating = false;

          if (provider.federated) {
            this.state.setActiveProvider(null, null);
            this.state.setTabId(FEDERATED_AUTH);
          }
        }

        return true;
      },
    }),
    {
      state: observable.ref,
      exception: computed,
      exceptionMap: observable.shallow,
      setException: action.bound,
      authenticating: observable.ref,
      authTask: observable.ref,
      tabIds: observable.ref,
      configure: computed,
      adminPageActive: observable.ref,
    },
    {
      state,
      adminPageActive,
      tabIds,
      providers: activeProviders,
      federatedProviders,
    },
  );

  useEffect(
    () => () => {
      data.destroyed = true;
      if (data.authTask?.executing) {
        data.authTask?.cancel();
      }
    },
    [],
  );

  if (tabIds.length > 0 && (state.tabId === null || !tabIds.includes(state.tabId))) {
    const provider = providers.find(provider => provider.id === providerId) || activeProviders[0] || null;
    const configuration =
      provider?.configurations?.find(configuration => configuration.id === configurationId) || provider?.configurations?.[0] || null;

    state.setActiveProvider(provider, configuration);
  }

  return data;
}

function notEmptyProvider(obj: any): obj is AuthProvider {
  return !!obj && typeof obj === 'object';
}

function compareProviders(providerA: AuthProvider, providerB: AuthProvider): number {
  if (providerA.defaultProvider === providerB.defaultProvider) {
    return providerA.label.localeCompare(providerB.label);
  }

  if (providerA.defaultProvider) {
    return -1;
  }
  return 1;
}

export function getAuthProviderTabId(provider: AuthProvider, configuration?: AuthProviderConfiguration | null): string {
  if (!configuration) {
    return provider.id;
  }
  return provider.id + '_' + configuration.id;
}
