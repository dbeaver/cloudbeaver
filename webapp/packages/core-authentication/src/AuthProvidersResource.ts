/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { PermissionsResource } from '@cloudbeaver/core-root';
import {
  GraphQLService,
  CachedDataResource,
  AuthProviderInfo
} from '@cloudbeaver/core-sdk';

export type AuthProvider = Omit<AuthProviderInfo, 'configurationParameters'>;

@injectable()
export class AuthProvidersResource extends CachedDataResource<AuthProvider[], void> {
  constructor(
    private graphQLService: GraphQLService,
    private permissionsResource: PermissionsResource
  ) {
    super([]);

    this.permissionsResource.onDataUpdate.addHandler(() => this.markOutdated());
  }

  protected async loader(): Promise<AuthProvider[]> {
    const { providers } = await this.graphQLService.sdk.getAuthProviders();
    return providers;
  }
}
