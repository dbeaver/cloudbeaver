/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, computed, observable } from 'mobx';
import { useEffect } from 'react';

import { AdministrationScreenService } from '@cloudbeaver/core-administration';
import { AuthInfoService, AuthProvider, AuthProviderConfiguration, AuthProvidersResource, IAuthCredentials } from '@cloudbeaver/core-authentication';
import { useObservableRef, useResource } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import type { ITask } from '@cloudbeaver/core-executor';
import { CachedMapAllKey, UserInfo } from '@cloudbeaver/core-sdk';

import { FEDERATED_AUTH } from './FEDERATED_AUTH';

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

  login: (linkUser: boolean, provider?: AuthProvider, configuration?: AuthProviderConfiguration) => Promise<void>;
  loginFederated: (provider: AuthProvider, configuration: AuthProviderConfiguration, onClose?: () => void) => Promise<void>;
}

interface IState {
  tabId: string | null;
  activeProvider: AuthProvider | null;
  activeConfiguration: AuthProviderConfiguration | null;
  credentials: IAuthCredentials;

  setTabId: (tabId: string | null) => void;
  setActiveProvider: (provider: AuthProvider | null, configuration: AuthProviderConfiguration | null) => void;
}

export function useAuthDialogState(accessRequest: boolean, providerId: string | null, configurationId?: string): IData {
  const authProvidersResource = useResource(useAuthDialogState, AuthProvidersResource, CachedMapAllKey);
  const administrationScreenService = useService(AdministrationScreenService);
  const authInfoService = useService(AuthInfoService);
  const notificationService = useService(NotificationService);

  const primaryId = authProvidersResource.resource.getPrimary();
  const adminPageActive = administrationScreenService.isAdministrationPageActive;
  const providers = authProvidersResource.data.filter(notEmptyProvider).sort(compareProviders);

  const state = useObservableRef<IState>(
    () => ({
      tabId: null,
      activeProvider: null,
      activeConfiguration: null,
      credentials: {
        profile: '0',
        credentials: {},
      },

      setTabId(tabId: string | null): void {
        this.tabId = tabId;
      },
      setActiveProvider(provider: AuthProvider | null, configuration: AuthProviderConfiguration | null): void {
        this.activeProvider = provider;
        this.credentials.profile = '0';
        this.credentials.credentials = {};
        this.activeConfiguration = configuration;

        if (provider) {
          this.setTabId(getAuthProviderTabId(provider, configuration));
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
      setActiveProvider: action,
    },
    false,
  );

  const activeProviders = providers.filter(provider => {
    if (provider.id === primaryId && adminPageActive && accessRequest) {
      return true;
    }

    if (provider.federated || provider.trusted || provider.private) {
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

  const tabIds = activeProviders.map(provider => provider.id);

  if (federatedProviders.length > 0) {
    tabIds.push(FEDERATED_AUTH);
  }

  const data = useObservableRef<IData>(
    () => ({
      exception: null,
      authenticating: false,
      authTask: null,
      destroyed: false,

      get configure(): boolean {
        if (state.activeProvider) {
          if (this.adminPageActive && authProvidersResource.resource.isPrimary(state.activeProvider.id)) {
            return false;
          }
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

        this.authenticating = true;
        try {
          if (configuration) {
            this.state.setActiveProvider(provider, configuration);
          }

          const loginTask = authInfoService.login(provider.id, {
            configurationId: configuration?.id,
            credentials: state.credentials,
            linkUser,
          });
          this.authTask = loginTask;

          await loginTask;
        } catch (exception: any) {
          if (this.destroyed) {
            notificationService.logException(exception, 'Login failed');
          } else {
            this.exception = exception;
          }
          throw exception;
        } finally {
          this.authTask = null;
          this.authenticating = false;

          if (configuration) {
            this.state.setActiveProvider(null, null);
          }
        }
      },
    }),
    {
      state: observable.ref,
      exception: observable.ref,
      authenticating: observable.ref,
      authTask: observable.ref,
      configure: computed,
      adminPageActive: observable.ref,
    },
    {
      state,
      adminPageActive,
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
