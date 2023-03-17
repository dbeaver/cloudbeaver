/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { SessionPermissionsResource, SessionDataResource } from '@cloudbeaver/core-root';
import { AuthProviderConfigurationParametersFragment, CachedMapResource, GetAuthProviderConfigurationParametersQueryVariables, GraphQLService, isResourceAlias, ResourceKey, ResourceKeyUtils } from '@cloudbeaver/core-sdk';

import { EAdminPermission } from './EAdminPermission';

@injectable()
export class AuthConfigurationParametersResource
  extends CachedMapResource<
  string,
  AuthProviderConfigurationParametersFragment[],
  GetAuthProviderConfigurationParametersQueryVariables
  > {
  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly sessionDataResource: SessionDataResource,
    permissionsResource: SessionPermissionsResource,
  ) {
    super();

    this.sessionDataResource.outdateResource(this);
    permissionsResource.require(this, EAdminPermission.admin);
  }

  protected async loader(
    key: ResourceKey<string>
  ): Promise<Map<string, AuthProviderConfigurationParametersFragment[]>> {
    if (isResourceAlias(key)) {
      throw new Error('Aliases not supported by this resource.');
    }

    const values: AuthProviderConfigurationParametersFragment[][] = [];
    await ResourceKeyUtils.forEachAsync(key, async key => {
      const { parameters } = await this.graphQLService.sdk.getAuthProviderConfigurationParameters({ providerId: key });

      values.push(parameters);
    });

    this.set(ResourceKeyUtils.toList(key), values);

    return this.data;
  }

  protected validateKey(key: string): boolean {
    return typeof key === 'string';
  }
}
