/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, computed, observable } from 'mobx';
import { useEffect } from 'react';

import { AdministrationScreenService } from '@cloudbeaver/core-administration';
import { AuthInfoService, AuthProvider, AuthProviderConfiguration, AuthProvidersResource, IAuthCredentials } from '@cloudbeaver/core-authentication';
import { useResource, useObservableRef } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { CachedMapAllKey } from '@cloudbeaver/core-sdk';
import type { ILoadableState } from '@cloudbeaver/core-utils';

import { FEDERATED_AUTH } from './FEDERATED_AUTH';

interface IData {
  state: IState;
  exception: Error | null;
  authenticating: boolean;
  destroyed: boolean;
  configure: boolean;
  adminPageActive: boolean;
  providers: AuthProvider[];
  configurations: AuthProvider[];

  login: (linkUser: boolean) => Promise<void>;
}

interface IState {
  tabId: string | null;
  activeProvider: AuthProvider | null;
  activeConfiguration: AuthProviderConfiguration | null;
  credentials: IAuthCredentials;

  setTabId: (tabId: string) => void;
  setActiveProvider: (provider: AuthProvider | null) => void;
  setActiveConfiguration: (provider: AuthProvider | null, configuration: AuthProviderConfiguration | null) => void;
}

export function useAuthDialogState(accessRequest: boolean, providerId: string | null, configurationId?: string): IData {
  const authProvidersResource = useResource(useAuthDialogState, AuthProvidersResource, CachedMapAllKey);
  const administrationScreenService = useService(AdministrationScreenService);
  const authInfoService = useService(AuthInfoService);
  const notificationService = useService(NotificationService);

  const primaryId = authProvidersResource.resource.getPrimary();
  const adminPageActive = administrationScreenService.isAdministrationPageActive;
  const providers = authProvidersResource.data
    .filter(notEmptyProvider)
    .sort(compareProviders);

  const state = useObservableRef<IState>(() => ({
    tabId: null,
    activeProvider: null,
    activeConfiguration: null,
    credentials: {
      profile: '0',
      credentials: {},
    },

    setTabId(tabId: string): void {
      this.tabId = tabId;
    },
    setActiveProvider(provider: AuthProvider | null): void {
      this.activeProvider = provider;
      this.credentials.profile = '0';
      this.credentials.credentials = {};
      this.activeConfiguration = null;
    },
    setActiveConfiguration(
      provider: AuthProvider | null,
      configuration: AuthProviderConfiguration | null
    ): void {
      this.setActiveProvider(provider);
      this.activeConfiguration = configuration;
    },
  }), {
    tabId: observable.ref,
    activeProvider: observable.ref,
    activeConfiguration: observable.ref,
    credentials: observable,
    setActiveProvider: action,
    setActiveConfiguration: action,
  }, false);

  const activeProviders = providers
    .filter(provider => {
      if (provider.id === primaryId && adminPageActive && accessRequest) {
        return true;
      }

      if (provider.configurable || provider.trusted || provider.private) {
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

  const configurations = providers.filter(provider => (
    provider.configurable
    && (provider.configurations?.length || 0) > 0
    && authProvidersResource.resource.isAuthEnabled(provider.id)
  ));

  const tabIds = activeProviders.map(provider => provider.id);

  if (configurations.length > 0) {
    tabIds.push(FEDERATED_AUTH);
  }

  const data = useObservableRef<IData>(() => ({
    exception: null,
    authenticating: false,
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
    async login(linkUser: boolean): Promise<void> {
      if (!state.activeProvider || this.authenticating) {
        return;
      }

      this.authenticating = true;
      try {
        await authInfoService.login(state.activeProvider.id, {
          credentials: state.credentials,
          linkUser,
        });
      } catch (exception: any) {
        if (this.destroyed) {
          notificationService.logException(exception, 'Login failed');
        } else {
          this.exception = exception;
        }
        throw exception;
      } finally {
        this.authenticating = false;
      }
    },
  }), {
    state: observable.ref,
    exception: observable.ref,
    authenticating: observable.ref,
    configure: computed,
    adminPageActive: observable.ref,
  }, {
    state,
    adminPageActive,
    providers: activeProviders,
    configurations,
  });

  useEffect(() => () => { data.destroyed = true; }, []);

  if (tabIds.length > 0 && (state.tabId === null || !tabIds.includes(state.tabId))) {
    const tabId = tabIds[0];
    state.setTabId(tabId);

    const provider = (
      activeProviders.find(provider => provider.id === tabId)
      || providers.find(provider => provider.id === providerId)
      || null
    );
    const configuration = provider?.configurations?.find(
      configuration => configuration.id === configurationId
    ) ?? null;

    state.setActiveConfiguration(provider, configuration);
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
