/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';

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
  @observable private loaded;

  constructor(
    private graphQLService: GraphQLService,
    private permissionsResource: PermissionsResource
  ) {
    super([]);
    this.loaded = false;
    this.permissionsResource.onDataUpdate.addHandler(() => this.markOutdated());
  }

  isLoaded(): boolean {
    return this.loaded;
  }

  protected async loader(): Promise<AuthProvider[]> {
    const { providers } = await this.graphQLService.sdk.getAuthProviders();
    this.loaded = true;
    return providers;
  }
}
