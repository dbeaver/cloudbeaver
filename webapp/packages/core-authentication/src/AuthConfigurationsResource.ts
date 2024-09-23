/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { runInAction } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import {
  CachedMapAllKey,
  CachedMapResource,
  isResourceAlias,
  type ResourceKey,
  resourceKeyList,
  type ResourceKeySimple,
  ResourceKeyUtils,
} from '@cloudbeaver/core-resource';
import { EAdminPermission, SessionPermissionsResource } from '@cloudbeaver/core-root';
import { type AdminAuthProviderConfiguration, type GetAuthProviderConfigurationsQueryVariables, GraphQLService } from '@cloudbeaver/core-sdk';

import type { AuthProviderConfiguration } from './AuthProvidersResource.js';

const NEW_CONFIGURATION_SYMBOL = Symbol('new-configuration');

export type AuthConfiguration = AdminAuthProviderConfiguration;

type NewConfiguration = AuthConfiguration & { [NEW_CONFIGURATION_SYMBOL]: boolean; timestamp: number };

@injectable()
export class AuthConfigurationsResource extends CachedMapResource<string, AuthConfiguration, GetAuthProviderConfigurationsQueryVariables> {
  constructor(
    private readonly graphQLService: GraphQLService,
    permissionsResource: SessionPermissionsResource,
  ) {
    super(() => new Map(), []);

    permissionsResource.require(this, EAdminPermission.admin).outdateResource(this);
  }

  async saveConfiguration(config: AuthConfiguration): Promise<AuthConfiguration> {
    await this.performUpdate(config.id, [], async () => {
      const response = await this.graphQLService.sdk.saveAuthProviderConfiguration(config);

      let configuration: AuthConfiguration | NewConfiguration = response.configuration;

      if (!this.has(config.id)) {
        configuration = {
          ...configuration,
          [NEW_CONFIGURATION_SYMBOL]: true,
          timestamp: Date.now(),
        };
      }

      this.set(configuration.id, configuration);
      this.onDataOutdated.execute(configuration.id);
    });

    return this.get(config.id)!;
  }

  async deleteConfiguration(key: ResourceKeySimple<string>): Promise<void> {
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

  protected async loader(originalKey: ResourceKey<string>): Promise<Map<string, AuthConfiguration>> {
    const all = this.aliases.isAlias(originalKey, CachedMapAllKey);
    const configurationsList: AuthConfiguration[] = [];

    await ResourceKeyUtils.forEachAsync(originalKey, async key => {
      let providerId: string | undefined;

      if (!isResourceAlias(key)) {
        providerId = key;
      }

      const { configurations } = await this.graphQLService.sdk.getAuthProviderConfigurations({
        providerId,
      });

      configurationsList.push(...configurations);
    });

    runInAction(() => {
      const key = resourceKeyList(configurationsList.map(configuration => configuration.id));

      if (all) {
        this.replace(key, configurationsList);
      } else {
        this.set(key, configurationsList);
      }
    });

    return this.data;
  }

  protected override dataSet(key: string, value: AdminAuthProviderConfiguration): void {
    const oldConfiguration = this.dataGet(key);
    super.dataSet(key, { ...oldConfiguration, ...value });
  }

  protected validateKey(key: string): boolean {
    return typeof key === 'string';
  }
}

function isNewConfiguration(configuration: AuthConfiguration | NewConfiguration): configuration is NewConfiguration {
  return (configuration as NewConfiguration)[NEW_CONFIGURATION_SYMBOL];
}

export function compareAuthConfigurations(a: AuthConfiguration, b: AuthConfiguration): number {
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
