/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed, makeObservable, runInAction } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import {
  AuthProviderConfigurationInfoFragment,
  AuthProviderInfoFragment,
  CachedMapAllKey,
  CachedMapResource,
  GraphQLService,
  ResourceKey,
  resourceKeyList,
  ResourceKeySimple,
  ResourceKeyUtils,
} from '@cloudbeaver/core-sdk';

import { AuthConfigurationsResource } from './AuthConfigurationsResource';
import { AuthSettingsService } from './AuthSettingsService';

export type AuthProvider = NonNullable<AuthProviderInfoFragment>;
export type AuthProviderConfiguration = NonNullable<AuthProviderConfigurationInfoFragment>;

@injectable()
export class AuthProvidersResource extends CachedMapResource<string, AuthProvider> {
  get configurable(): AuthProvider[] {
    return this.values.filter(provider => provider.configurable);
  }

  constructor(
    private readonly authSettingsService: AuthSettingsService,
    private readonly graphQLService: GraphQLService,
    private readonly serverConfigResource: ServerConfigResource,
    private readonly authConfigurationsResource: AuthConfigurationsResource,
  ) {
    super();

    this.sync(
      serverConfigResource,
      () => {},
      () => CachedMapAllKey,
    );

    this.authConfigurationsResource.onItemUpdate.addHandler(this.updateConfigurations.bind(this));
    this.authConfigurationsResource.onItemDelete.addHandler(this.deleteConfigurations.bind(this));

    makeObservable(this, {
      configurable: computed,
    });
  }

  getConfiguration(providerId: string, configurationId: string): AuthProviderConfiguration | undefined {
    const provider = this.get(providerId);

    if (provider) {
      return provider.configurations?.find(configuration => configuration.id === configurationId);
    }

    return undefined;
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

  async refreshAll(): Promise<AuthProvider[]> {
    this.resetIncludes();
    await this.refresh(CachedMapAllKey);
    return this.values;
  }

  refreshAllLazy(): void {
    this.resetIncludes();
    this.markOutdated(CachedMapAllKey);
  }

  protected async loader(originalKey: ResourceKey<string>): Promise<Map<string, AuthProvider>> {
    const all = this.aliases.isAlias(originalKey, CachedMapAllKey);

    const { providers } = await this.graphQLService.sdk.getAuthProviders();

    const key = resourceKeyList(providers.map(provider => provider.id));
    if (all) {
      this.replace(key, providers);
    } else {
      this.set(key, providers);
    }
    return this.data;
  }

  private updateConfigurations(key: ResourceKeySimple<string>) {
    const configurations = this.authConfigurationsResource.get(ResourceKeyUtils.toList(key));

    const providerIds = resourceKeyList(configurations.filter(Boolean).map(configuration => configuration!.providerId));

    this.markOutdated(providerIds);
  }

  private deleteConfigurations(key: ResourceKeySimple<string>) {
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

  protected validateKey(key: string): boolean {
    return typeof key === 'string';
  }
}
