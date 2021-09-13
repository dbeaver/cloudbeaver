/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { runInAction } from 'mobx';

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
} from '@cloudbeaver/core-sdk';
import { MetadataMap } from '@cloudbeaver/core-utils';

import { AuthConfigurationsResource } from './AuthConfigurationsResource';
import { AuthSettingsService } from './AuthSettingsService';

export type AuthProvider = AuthProviderInfo;

@injectable()
export class AuthProvidersResource extends CachedMapResource<string, AuthProvider, void> {
  static keyAll = resourceKeyList(['all'], 'all');
  private loadedKeyMetadata: MetadataMap<string, boolean>;

  constructor(
    private readonly authSettingsService: AuthSettingsService,
    private readonly graphQLService: GraphQLService,
    private readonly serverConfigResource: ServerConfigResource,
    private readonly authConfigurationsResource: AuthConfigurationsResource
  ) {
    super();
    this.loadedKeyMetadata = new MetadataMap(() => false);

    this.serverConfigResource.onDataOutdated.addHandler(() => this.markOutdated());
    this.serverConfigResource.onDataUpdate.addHandler(async () => { await this.load(AuthProvidersResource.keyAll); });
    this.addAlias(AuthProvidersResource.keyAll, key => {
      if (this.keys.length > 0) {
        return resourceKeyList(this.keys, AuthProvidersResource.keyAll.mark);
      }
      return AuthProvidersResource.keyAll;
    });

    this.authConfigurationsResource.onItemAdd.addHandler(this.updateConfigurations.bind(this));
    this.authConfigurationsResource.onItemDelete.addHandler(this.deleteConfigurations.bind(this));
  }

  has(id: string): boolean {
    if (this.loadedKeyMetadata.has(id)) {
      return this.loadedKeyMetadata.get(id);
    }

    return this.data.has(id);
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
    this.resetIncludes();
    await this.load(AuthProvidersResource.keyAll);

    return this.values;
  }

  async refreshAll(): Promise<AuthProvider[]> {
    this.resetIncludes();
    await this.refresh(AuthProvidersResource.keyAll);
    return this.values;
  }

  refreshAllLazy(): void {
    this.resetIncludes();
    this.markOutdated(AuthProvidersResource.keyAll);
    this.loadedKeyMetadata.set(AuthProvidersResource.keyAll.list[0], false);
  }

  protected async loader(key: ResourceKey<string>): Promise<Map<string, AuthProvider>> {
    const { providers } = await this.graphQLService.sdk.getAuthProviders();

    const all = ResourceKeyUtils.hasMark(key, AuthProvidersResource.keyAll.mark);

    runInAction(() => {
      if (all) {
        this.data.clear();
      }

      for (const provider of providers) {
        this.data.set(provider.id, provider as AuthProvider);
      }
    });

    if (all) {
      this.loadedKeyMetadata.set(AuthProvidersResource.keyAll.list[0], true);
    }
    return this.data;
  }

  private updateConfigurations(key: ResourceKey<string>) {
    this.loadedKeyMetadata.set(AuthProvidersResource.keyAll.mark, false);

    const configurations = isResourceKeyList(key)
      ? this.authConfigurationsResource.get(key) : [this.authConfigurationsResource.get(key)];

    const providerIds = resourceKeyList(
      configurations.filter(Boolean).map(configuration => configuration!.providerId)
    );

    this.markOutdated(providerIds);
  }

  private deleteConfigurations(key: ResourceKey<string>) {
    this.values.forEach(provider => {
      if (provider.configurable && provider.configurations?.length) {
        ResourceKeyUtils.forEach(key, id => {
          const index = provider.configurations!.findIndex(configuration => configuration.id === id);
          if (index >= 0) {
            provider.configurations!.splice(index, 1);
          }
        });
      }
    });
  }
}
