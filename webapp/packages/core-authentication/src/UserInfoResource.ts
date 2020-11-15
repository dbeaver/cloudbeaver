/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { SessionResource } from '@cloudbeaver/core-root';
import { CachedDataResource, GraphQLService, UserAuthInfo } from '@cloudbeaver/core-sdk';

import { AuthProviderService } from './AuthProviderService';

@injectable()
export class UserInfoResource extends CachedDataResource<UserAuthInfo | null, void> {
  @observable private loaded: boolean;

  constructor(
    private graphQLService: GraphQLService,
    private authProviderService: AuthProviderService,
    private sessionResource: SessionResource
  ) {
    super(null);
    this.loaded = false;
    this.sessionResource.onDataOutdated.addHandler(() => this.markOutdated());
    this.sessionResource.onDataUpdate.addHandler(async () => { await this.load(); });
  }

  getId(): string {
    return this.data?.userId || 'anonymous';
  }

  isLoaded(): boolean {
    return this.loaded;
  }

  async login(provider: string, credentials: Record<string, string>): Promise<UserAuthInfo> {
    if (this.data) {
      throw new Error('User already logged in');
    }

    const processedCredentials = await this.authProviderService.processCredentials(provider, credentials);

    const { user } = await this.graphQLService.sdk.authLogin({
      provider,
      credentials: processedCredentials,
    });
    this.data = user as UserAuthInfo;

    await this.updateSession();
    return this.data;
  }

  async logout(): Promise<void> {
    if (this.data) {
      await this.graphQLService.sdk.authLogout();
      this.data = null;
      await this.updateSession();
    }
  }

  protected async loader(): Promise<UserAuthInfo | null> {
    await this.sessionResource.load();
    const { user } = await this.graphQLService.sdk.getSessionUser();
    this.loaded = true;

    return (user as UserAuthInfo | null) ?? null;
  }

  private async updateSession() {
    await this.sessionResource.refresh();
  }
}
