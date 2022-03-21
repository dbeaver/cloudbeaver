/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed, observable } from 'mobx';
import { useEffect } from 'react';

import { AdministrationScreenService } from '@cloudbeaver/core-administration';
import { AuthInfoService, AuthProvider, AuthProvidersResource, IAuthCredentials } from '@cloudbeaver/core-authentication';
import { ILoadableState, useMapResource, useObservableRef } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { CachedMapAllKey } from '@cloudbeaver/core-sdk';

import { FEDERATED_AUTH } from './FEDERATED_AUTH';

interface IState {
  tabId: string | null;
  activeProvider: AuthProvider | null;
  exception: Error | null;
  authenticating: boolean;
  destroyed: boolean;
  configure: boolean;
  adminPageActive: boolean;
  credentials: IAuthCredentials;
  loadingState: ILoadableState;
  providers: AuthProvider[];
  configurations: AuthProvider[];

  setTabId: (tabId: string) => void;
  setActiveProvider: (provider: AuthProvider | null) => void;
  login: (link: boolean) => Promise<void>;
}

export function useAuthDialogState(providerId: string | null): IState {
  const authProvidersResource = useMapResource(useAuthDialogState, AuthProvidersResource, CachedMapAllKey);
  const administrationScreenService = useService(AdministrationScreenService);
  const authInfoService = useService(AuthInfoService);
  const notificationService = useService(NotificationService);

  const primaryId = authProvidersResource.resource.getPrimary();
  const adminPageActive = administrationScreenService.isAdministrationPageActive;
  const providers = authProvidersResource.data
    .filter(notEmptyProvider)
    .sort(compareProviders);

  const activeProviders = providers
    .filter(provider => {
      if (provider.configurable) {
        return false;
      }

      if (providerId !== null) {
        return provider.id === providerId;
      }

      const active = authProvidersResource.resource.isAuthEnabled(provider.id);

      if (active) {
        return true;
      }

      if (provider.id === primaryId) {
        return adminPageActive;
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

  const state = useObservableRef<IState>(() => ({
    tabId: null,
    activeProvider: null,
    exception: null,
    authenticating: false,
    destroyed: false,
    credentials: {
      profile: '0',
      credentials: {},
    },
    loadingState: authProvidersResource,

    get configure(): boolean {
      if (this.activeProvider) {
        if (this.adminPageActive && authProvidersResource.resource.isPrimary(this.activeProvider.id)) {
          return false;
        }
        return !authProvidersResource.resource.isAuthEnabled(this.activeProvider.id);
      }
      return false;
    },

    setTabId(tabId: string): void {
      this.tabId = tabId;
    },
    setActiveProvider(provider: AuthProvider | null): void {
      this.activeProvider = provider;
      this.credentials.profile = '0';
      this.credentials.credentials = {};
    },
    async login(link: boolean): Promise<void> {
      if (!this.activeProvider || this.authenticating) {
        return;
      }

      this.authenticating = true;
      try {
        await authInfoService.login(this.activeProvider.id, this.credentials, link);
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
    tabId: observable.ref,
    activeProvider: observable.ref,
    exception: observable.ref,
    authenticating: observable.ref,
    configure: computed,
    adminPageActive: observable.ref,
    credentials: observable,
  }, {
    adminPageActive,
    providers: activeProviders,
    configurations,
  });

  useEffect(() => () => { state.destroyed = true; }, []);

  if (tabIds.length > 0 && (state.tabId === null || !tabIds.includes(state.tabId))
  ) {
    const tabId = tabIds[0];
    state.setTabId(tabId);
    state.setActiveProvider(activeProviders.find(provider => provider.id === tabId) || null);
  }

  return state;
}

function notEmptyProvider(obj: any): obj is AuthProvider {
  return typeof obj === 'object';
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
