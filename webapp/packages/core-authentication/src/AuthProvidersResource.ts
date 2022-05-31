/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed, makeObservable, runInAction } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import {
  GraphQLService,
  AuthProviderInfo,
  CachedMapResource,
  ResourceKey,
  resourceKeyList,
  ResourceKeyUtils,
  isResourceKeyList,
  CachedMapAllKey,
  AuthProviderConfiguration as BaseAuthProviderConfiguration,
} from '@cloudbeaver/core-sdk';

import { AuthConfigurationsResource } from './AuthConfigurationsResource';
import { AuthSettingsService } from './AuthSettingsService';

export type AuthProvider = AuthProviderInfo;
export type AuthProviderConfiguration = BaseAuthProviderConfiguration;

@injectable()
export class AuthProvidersResource extends CachedMapResource<string, AuthProvider> {
  get configurable(): AuthProvider[] {
    return this.values.filter(provider => provider.configurable);
  }

  constructor(
    private readonly authSettingsService: AuthSettingsService,
    private readonly graphQLService: GraphQLService,
    private readonly serverConfigResource: ServerConfigResource,
    private readonly authConfigurationsResource: AuthConfigurationsResource
  ) {
    super();

    this.preloadResource(serverConfigResource, () => {});
    this.serverConfigResource.outdateResource(this);

    this.authConfigurationsResource.onItemAdd.addHandler(this.updateConfigurations.bind(this));
    this.authConfigurationsResource.onItemDelete.addHandler(this.deleteConfigurations.bind(this));

    makeObservable(this, {
      configurable: computed,
    });
  }

  getEnabledProviders(): AuthProvider[] {
    return this.get(resourceKeyList(this.serverConfigResource.enabledAuthProviders)) as AuthProvider[];
  }

  getBase(): string | undefined {
    return this.authSettingsService.settings.getValue('baseAuthProvider');
  }

  getPrimary(): string {
    return this.authSettingsService.settings.getValue('primaryAuthProvider');
  }

  isEnabled(id: string): boolean {
    return this.isAuthEnabled(id);
  }

  isBase(id: string): boolean {
    return id === this.getBase();
  }

  isPrimary(id: string): boolean {
    return id === this.getPrimary();
  }

  isAuthEnabled(id: string): boolean {
    return this.serverConfigResource.enabledAuthProviders.includes(id);
  }

  async loadAll(): Promise<AuthProvider[]> {
    await this.load(CachedMapAllKey);

    return this.values;
  }

  async refreshAll(): Promise<AuthProvider[]> {
    this.resetIncludes();
    await this.refresh(CachedMapAllKey);
    return this.values;
  }

  refreshAllLazy(): void {
    this.resetIncludes();
    this.markOutdated(CachedMapAllKey);
  }

  protected async loader(key: ResourceKey<string>): Promise<Map<string, AuthProvider>> {
    const all = ResourceKeyUtils.includes(key, CachedMapAllKey);

    const { providers } = await this.graphQLService.sdk.getAuthProviders();

    runInAction(() => {
      if (all) {
        this.data.clear();
      }

      for (const provider of providers) {
        this.data.set(provider.id, provider as AuthProvider);
      }
    });
    return this.data;
  }

  private updateConfigurations(key: ResourceKey<string>) {
    const configurations = isResourceKeyList(key)
      ? this.authConfigurationsResource.get(key)
      : [this.authConfigurationsResource.get(key)];

    const providerIds = resourceKeyList(
      configurations.filter(Boolean).map(configuration => configuration!.providerId)
    );

    this.markOutdated(providerIds);
  }

  private deleteConfigurations(key: ResourceKey<string>) {
    runInAction(() => {
      for (const provider of this.values) {
        if (provider.configurable && provider.configurations?.length) {
          ResourceKeyUtils.forEach(key, id => {
            const index = provider.configurations!.findIndex(configuration => configuration.id === id);
            if (index >= 0) {
              provider.configurations!.splice(index, 1);
            }
          });
        }
      }
    });
  }
}
