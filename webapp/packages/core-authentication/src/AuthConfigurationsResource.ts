/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { runInAction } from 'mobx';

import { EAdminPermission } from '@cloudbeaver/core-administration';
import { injectable } from '@cloudbeaver/core-di';
import { PermissionsResource } from '@cloudbeaver/core-root';
import {
  AdminAuthProviderConfiguration, AuthProviderConfiguration,
  CachedMapAllKey,
  CachedMapResource, GetAuthProviderConfigurationsQueryVariables,
  GraphQLService, ResourceKey, ResourceKeyList, resourceKeyList, ResourceKeyUtils
} from '@cloudbeaver/core-sdk';

const NEW_CONFIGURATION_SYMBOL = Symbol('new-configuration');

export type AuthConfiguration = AdminAuthProviderConfiguration;

type NewConfiguration = AuthConfiguration & { [NEW_CONFIGURATION_SYMBOL]: boolean; timestamp: number };

@injectable()
export class AuthConfigurationsResource
  extends CachedMapResource<string, AuthConfiguration, GetAuthProviderConfigurationsQueryVariables> {
  constructor(
    private readonly graphQLService: GraphQLService,
    permissionsResource: PermissionsResource,
  ) {
    super([]);

    permissionsResource
      .require(this, EAdminPermission.admin)
      .outdateResource(this);
  }

  async loader(key: ResourceKey<string>): Promise<Map<string, AuthConfiguration>> {
    const all = ResourceKeyUtils.includes(key, CachedMapAllKey);
    key = this.transformParam(key);

    await ResourceKeyUtils.forEachAsync(all ? CachedMapAllKey : key, async key => {
      const providerId = all ? undefined : key;

      const { configurations } = await this.graphQLService.sdk.getAuthProviderConfigurations({
        providerId,
      });

      runInAction(() => {
        if (all) {
          this.data.clear();
        }

        this.updateConfiguration(...configurations);
      });
    });

    return this.data;
  }

  async refreshAll(): Promise<AuthConfiguration[]> {
    await this.refresh(CachedMapAllKey);
    return this.values;
  }

  async saveConfiguration(config: AuthConfiguration): Promise<AuthConfiguration> {
    await this.performUpdate(config.id, [], async () => {
      const response = await this.graphQLService.sdk.saveAuthProviderConfiguration(config);

      let configuration: AuthConfiguration | NewConfiguration = response.configuration;

      if (!this.data.has(config.id)) {
        configuration = {
          ...configuration,
          [NEW_CONFIGURATION_SYMBOL]: true,
          timestamp: Date.now(),
        };
      }

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

  cleanNewFlags(): void {
    for (const configuration of this.data.values()) {
      (configuration as NewConfiguration)[NEW_CONFIGURATION_SYMBOL] = false;
    }
  }

  private updateConfiguration(...configurations: AuthConfiguration[]): ResourceKeyList<string> {
    const key = resourceKeyList(configurations.map(configuration => configuration.id));

    const oldConfiguration = this.get(key);
    this.set(key, oldConfiguration.map((configuration, i) => ({ ...configuration, ...configurations[i] })));

    return key;
  }
}

function isNewConfiguration(
  configuration: AuthConfiguration | NewConfiguration
): configuration is NewConfiguration {
  return (configuration as NewConfiguration)[NEW_CONFIGURATION_SYMBOL];
}

export function compareAuthConfigurations(
  a: AuthConfiguration, b: AuthConfiguration
): number {
  if (isNewConfiguration(a) && isNewConfiguration(b)) {
    return b.timestamp - a.timestamp;
  }

  if (isNewConfiguration(b)) {
    return 1;
  }

  if (isNewConfiguration(a)) {
    return -1;
  }

  return a.displayName.localeCompare(b.displayName);
}

export function comparePublicAuthConfigurations(a: AuthProviderConfiguration, b: AuthProviderConfiguration): number {
  return a.displayName.localeCompare(b.displayName);
}
