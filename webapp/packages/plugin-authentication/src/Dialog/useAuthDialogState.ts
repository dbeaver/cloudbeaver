/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, computed, observable, untracked } from 'mobx';
import { useEffect } from 'react';

import { AdministrationScreenService } from '@cloudbeaver/core-administration';
import {
  AuthInfoService,
  type AuthProvider,
  type AuthProviderConfiguration,
  AuthProvidersResource,
  type IAuthCredentials,
} from '@cloudbeaver/core-authentication';
import { ConfirmationDialog, useObservableRef, useResource } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { NotificationService, UIError } from '@cloudbeaver/core-events';
import type { ITask } from '@cloudbeaver/core-executor';
import { CachedMapAllKey } from '@cloudbeaver/core-resource';
import { EServerErrorCode, GQLError, type UserInfo } from '@cloudbeaver/core-sdk';
import { errorOf, isArraysEqual } from '@cloudbeaver/core-utils';

import { FEDERATED_AUTH } from './FEDERATED_AUTH.js';

interface IData {
  state: IState;
  exception: Error | null;
  authenticating: boolean;
  authTask: ITask<UserInfo | null> | null;
  destroyed: boolean;
  configure: boolean;
  adminPageActive: boolean;
  providers: AuthProvider[];
  federatedProviders: AuthProvider[];
  tabIds: string[];

  login: (linkUser: boolean, provider?: AuthProvider, configuration?: AuthProviderConfiguration) => Promise<void>;
  federatedLogin: (provider: AuthProvider, configuration: AuthProviderConfiguration) => Promise<void>;
}

interface IState {
  tabId: string | null;
  activeProvider: AuthProvider | null;
  activeConfiguration: AuthProviderConfiguration | null;
  credentials: IAuthCredentials;
  tabIds: string[];
  isTooManySessions: boolean;
  forceSessionsLogout: boolean;
  switchAuthMode: (tabId: string | null, resetError?: boolean) => void;
  setActiveProvider: (provider: AuthProvider | null, configuration: AuthProviderConfiguration | null) => void;
  resetErrorState: VoidFunction;
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
    if (provider.federated || provider.trusted || provider.private || provider.authHidden) {
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
      isTooManySessions: false,
      forceSessionsLogout: false,
      switchAuthMode(tabId: string | null, resetError = true): void {
        if (tabId !== null && tabId === this.tabId) {
          return;
        }

        if (tabIds.includes(tabId as any)) {
          this.tabId = tabId;
        } else {
          this.tabId = tabIds[0] ?? null;
        }

        if (resetError) {
          this.resetErrorState();
        }
      },
      resetErrorState(): void {
        this.isTooManySessions = false;
        this.forceSessionsLogout = false;
        data.exception = null;
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
            this.switchAuthMode(FEDERATED_AUTH);
          } else {
            this.switchAuthMode(getAuthProviderTabId(provider, configuration));
          }
        } else {
          this.switchAuthMode(null, false);
        }
      },
    }),
    {
      tabId: observable.ref,
      activeProvider: observable.ref,
      activeConfiguration: observable.ref,
      credentials: observable,
      isTooManySessions: observable.ref,
      forceSessionsLogout: observable.ref,
      switchAuthMode: action.bound,
      setActiveProvider: action.bound,
      resetErrorState: action.bound,
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
      exception: null,
      authenticating: false,
      authTask: null,
      destroyed: false,

      get configure(): boolean {
        if (state.activeProvider) {
          return !authProvidersResource.resource.isAuthEnabled(state.activeProvider.id);
        }
        return false;
      },
      async login(linkUser: boolean, provider?: AuthProvider, configuration?: AuthProviderConfiguration): Promise<void> {
        provider = (provider || state.activeProvider) ?? undefined;
        configuration = (configuration || state.activeConfiguration) ?? undefined;

        if (!provider || this.authenticating) {
          return;
        }

        if (state.isTooManySessions && state.forceSessionsLogout) {
          const result = await commonDialogService.open(ConfirmationDialog, {
            title: 'authentication_auth_force_session_logout_popup_title',
            message: 'authentication_auth_force_session_logout_popup_message',
          });

          if (result === DialogueStateResult.Rejected) {
            throw new UIError('Force session logout confirmation dialog rejected');
          }
        }

        this.authenticating = true;
        state.isTooManySessions = false;

        try {
          this.state.setActiveProvider(provider, configuration ?? null);

          if (provider.federated && configuration) {
            await this.federatedLogin(provider, configuration);
          } else {
            await authInfoService.login(provider.id, {
              configurationId: configuration?.id,
              credentials: {
                ...state.credentials,
                credentials: {
                  ...state.credentials.credentials,
                  user: state.credentials.credentials['user']?.trim(),
                  password: state.credentials.credentials['password']?.trim(),
                },
              },
              forceSessionsLogout: state.forceSessionsLogout,
              linkUser,
            });
          }
        } catch (exception: any) {
          const gqlError = errorOf(exception, GQLError);

          if (gqlError?.errorCode === EServerErrorCode.tooManySessions) {
            state.isTooManySessions = true;
          }

          if (this.destroyed) {
            notificationService.logException(exception, 'Login failed');
          } else {
            this.exception = exception;
          }

          throw exception;
        } finally {
          this.authTask = null;
          this.authenticating = false;

          if (provider.federated) {
            this.state.setActiveProvider(null, null);
            this.state.switchAuthMode(FEDERATED_AUTH, false);
          }
        }

        return;
      },
      async federatedLogin(provider: AuthProvider, configuration: AuthProviderConfiguration): Promise<void> {
        this.authTask = authInfoService.federatedLogin(provider.id, {
          configurationId: configuration.id,
          forceSessionsLogout: state.forceSessionsLogout,
          linkUser: false,
        });

        await this.authTask;
      },
    }),
    {
      state: observable.ref,
      exception: observable.ref,
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
