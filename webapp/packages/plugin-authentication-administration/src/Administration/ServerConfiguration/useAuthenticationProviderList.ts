/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, computed, observable } from 'mobx';

import { AUTH_PROVIDER_LOCAL_ID, type AuthProvider, type AuthProvidersResource, sortProvider } from '@cloudbeaver/core-authentication';
import { useObservableRef } from '@cloudbeaver/core-blocks';
import type { IServerConfig } from '@cloudbeaver/plugin-administration';

export type AuthenticationProviderFilter = 'all' | 'active' | 'available';

export interface IAuthenticationProviderList {
  query: string;
  filter: AuthenticationProviderFilter;
  readonly providerList: AuthProvider[];
  readonly activeProviders: AuthProvider[];
  readonly availableProviders: AuthProvider[];
  readonly counts: Record<AuthenticationProviderFilter, number>;
  readonly visibleProviders: AuthProvider[];
  setQuery(query: string): void;
  setFilter(filter: AuthenticationProviderFilter): void;
}

export function useAuthenticationProviderList(
  providers: AuthProvidersResource,
  serverConfig: IServerConfig,
  configurationWizard: boolean,
): IAuthenticationProviderList {
  return useObservableRef(
    () => ({
      query: '',
      filter: 'all' as AuthenticationProviderFilter,
      get providerList(): AuthProvider[] {
        return this.providers.values
          .filter(provider => {
            if (provider.private) {
              return false;
            }

            return (
              !this.configurationWizard ||
              (!provider.configurable &&
                !provider.authHidden &&
                provider.requiredFeatures.every(feature => this.serverConfig.enabledFeatures?.includes(feature)))
            );
          })
          .sort((a, b) => {
            if (a.id === AUTH_PROVIDER_LOCAL_ID) {
              return -1;
            }

            if (b.id === AUTH_PROVIDER_LOCAL_ID) {
              return 1;
            }

            return sortProvider(a, b);
          });
      },
      get activeProviders(): AuthProvider[] {
        return this.providerList.filter(provider => this.serverConfig.enabledAuthProviders?.includes(provider.id));
      },
      get availableProviders(): AuthProvider[] {
        return this.providerList.filter(
          provider =>
            !this.serverConfig.enabledAuthProviders?.includes(provider.id) &&
            provider.requiredFeatures.every(feature => this.serverConfig.enabledFeatures?.includes(feature)),
        );
      },
      get counts(): Record<AuthenticationProviderFilter, number> {
        return {
          all: this.providerList.length,
          active: this.activeProviders.length,
          available: this.availableProviders.length,
        };
      },
      get visibleProviders(): AuthProvider[] {
        const providersByFilter = {
          all: this.providerList,
          active: this.activeProviders,
          available: this.availableProviders,
        };

        const query = this.query.trim().toLocaleLowerCase();

        return providersByFilter[this.filter].filter(provider =>
          [provider.label, provider.id, provider.description].some(value => value?.toLocaleLowerCase().includes(query)),
        );
      },
      setQuery(query: string) {
        this.query = query;
      },
      setFilter(filter: AuthenticationProviderFilter) {
        this.filter = filter;
      },
    }),
    {
      query: observable.ref,
      filter: observable.ref,
      providers: observable.ref,
      serverConfig: observable.ref,
      configurationWizard: observable.ref,
      providerList: computed,
      activeProviders: computed,
      availableProviders: computed,
      counts: computed,
      visibleProviders: computed,
      setQuery: action.bound,
      setFilter: action.bound,
    },
    { providers, serverConfig, configurationWizard },
  );
}
