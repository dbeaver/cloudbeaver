/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { EAdminPermission } from '@cloudbeaver/core-administration';
import { injectable } from '@cloudbeaver/core-di';
import { PermissionsResource } from '@cloudbeaver/core-root';
import {
  AdminAuthProviderConfiguration, CachedMapResource, GetAuthProviderConfigurationsQueryVariables,
  GraphQLService, ResourceKey, ResourceKeyList, resourceKeyList, ResourceKeyUtils
} from '@cloudbeaver/core-sdk';
import { MetadataMap } from '@cloudbeaver/core-utils';

@injectable()
export class AuthConfigurationsResource
  extends CachedMapResource<string, AdminAuthProviderConfiguration, GetAuthProviderConfigurationsQueryVariables> {
  static keyAll = resourceKeyList(['all'], 'all');
  private loadedKeyMetadata: MetadataMap<string, boolean>;

  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly permissionsResource: PermissionsResource,
  ) {
    super([]);

    this.loadedKeyMetadata = new MetadataMap(() => false);

    this.permissionsResource.onDataOutdated.addHandler(this.markAllOutdated.bind(this));
  }

  has(id: string): boolean {
    if (this.loadedKeyMetadata.has(id)) {
      return this.loadedKeyMetadata.get(id);
    }

    return this.data.has(id);
  }

  async loader(key: ResourceKey<string>): Promise<Map<string, AdminAuthProviderConfiguration>> {
    if (!(await this.permissionsResource.hasAsync(EAdminPermission.admin))) {
      return this.data;
    }

    const all = ResourceKeyUtils.hasMark(key, AuthConfigurationsResource.keyAll.mark);

    await ResourceKeyUtils.forEachAsync(all ? AuthConfigurationsResource.keyAll : key, async key => {
      const { configurations } = await this.graphQLService.sdk.getAuthProviderConfigurations({
        providerId: !all ? key : undefined,
      });

      if (all) {
        this.data.clear();
      }

      this.updateConfiguration(...configurations);

      if (all) {
        this.loadedKeyMetadata.set(AuthConfigurationsResource.keyAll.list[0], true);
      }
    });

    return this.data;
  }

  private updateConfiguration(...configurations: AdminAuthProviderConfiguration[]): ResourceKeyList<string> {
    const key = resourceKeyList(configurations.map(configuration => configuration.id));

    const oldConfiguration = this.get(key);
    this.set(key, oldConfiguration.map((configuration, i) => ({ ...configuration, ...configurations[i] })));

    return key;
  }

  private markAllOutdated() {
    this.markOutdated();
    this.loadedKeyMetadata.set(AuthConfigurationsResource.keyAll.mark, false);
  }

  async refreshAll(): Promise<AdminAuthProviderConfiguration[]> {
    await this.refresh(AuthConfigurationsResource.keyAll);
    return this.values;
  }

  async saveConfiguration(config: AdminAuthProviderConfiguration): Promise<AdminAuthProviderConfiguration> {
    await this.performUpdate(config.id, [], async () => {
      const { configuration } = await this.graphQLService.sdk.saveAuthProviderConfiguration(config);

      this.updateConfiguration(configuration);
    });

    return this.get(config.id)!;
  }

  async deleteConfiguration(key: ResourceKey<string>): Promise<void> {
    await ResourceKeyUtils.forEachAsync(key, async key => {
      await this.graphQLService.sdk.deleteAuthProviderConfiguration({
        id: key,
      });
      this.delete(key);
    });
  }
}

export function compareConfigurations(a: AdminAuthProviderConfiguration, b: AdminAuthProviderConfiguration): number {
  return (a.providerId).localeCompare(b.providerId) || (a.displayName).localeCompare(b.displayName);
}
